/**
 * Конфигурация.
 */

module.exports = {
  /**
   * Урл для проксирования.
   */
  targetUrl: '',

  /**
   * Таймаут для проксирования.
   */
  timeout: 2000,

  /**
   * Ответ в случае ошибки.
   */
  errorText: '',

  /**
   * Список разрешенных user_id, например 'DAA3023F5799FB3B6E78A078ED17844C1D05A51FFF3A6003C81B7880C34A7A74'.
   * Если пустой - разрешено всем пользователям.
   */
  allowedUsers: [ ],

  /**
   * Телеграм урл для уведомлений об ошибках.
   * Формат: https://api.telegram.org/bot[BOT_API_KEY]/sendMessage?chat_id=[MY_CHANNEL_NAME]
   *
   * Если нужно послать личное сообщение от бота: https://stackoverflow.com/a/50736131/740245
   */
  tgNotifyUrl: '',
};
