const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');
const { onValueCreated } = require('firebase-functions/v2/database');
const logger = require('firebase-functions/logger');

initializeApp({ databaseURL: 'https://chat-f04e4-default-rtdb.firebaseio.com' });

// 새 채팅 메시지가 RTDB에 저장되면, 해당 방을 방문했던 다른 기기들에 푸시합니다.
exports.notifyRoomMessage = onValueCreated({
  ref: '/kakao_chat_app/messages/{roomId}/{messageId}',
  region: 'us-central1',
  retry: false
}, async (event) => {
  const message = event.data.val();
  const roomId = event.params.roomId;
  if (!message || message.type === 'system' || !message.sender || !message.text) return;

  const db = getDatabase();
  const [membersSnap, tokensSnap, roomSnap] = await Promise.all([
    db.ref(`kakao_chat_app/notification_room_members/${roomId}`).once('value'),
    db.ref('kakao_chat_app/fcmTokens').once('value'),
    db.ref(`kakao_chat_app/rooms/${roomId}`).once('value')
  ]);

  const members = membersSnap.val() || {};
  const tokenRecords = tokensSnap.val() || {};
  const room = roomSnap.val() || {};
  const roomName = room.name || '채팅방';
  const tokens = [];
  const seen = new Set();

  for (const [deviceId, membership] of Object.entries(members)) {
    if (!membership || membership.userName === message.sender) continue;
    const record = tokenRecords[deviceId];
    if (!record || !record.token || record.userName !== membership.userName) continue;
    if (seen.has(record.token)) continue;
    seen.add(record.token);
    tokens.push(record.token);
  }
  if (!tokens.length) return;

  const title = `${message.sender} (${roomName})`;
  const body = String(message.text).slice(0, 180);
  // Web Push의 data-only 메시지를 서비스 워커가 표시합니다.
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const result = await getMessaging().sendEachForMulticast({
      tokens: batch,
      data: { title, body, roomId: String(roomId), roomName: String(roomName) }
    });
    logger.info('쌉싸오톡 푸시 전송 결과', { roomId, successCount: result.successCount, failureCount: result.failureCount });

    // 만료/폐기된 토큰은 다음부터 보내지 않도록 정리합니다.
    const updates = {};
    result.responses.forEach((response, index) => {
      const code = response.error && response.error.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        const token = batch[index];
        for (const [deviceId, record] of Object.entries(tokenRecords)) {
          if (record && record.token === token) updates[`kakao_chat_app/fcmTokens/${deviceId}`] = null;
        }
      }
    });
    if (Object.keys(updates).length) await db.ref().update(updates);
  }
});
