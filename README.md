# alice-cloud-proxy

Готовая [облачная функция](https://cloud.yandex.ru/docs/functions/concepts/function) для быстрого развертывания своего прокси-навыка на Я.Облаке. Это позволяет тестировать другие навыки прямо в приложениях с Алисой.

<!-- toc -->

- [Подробнее](#%D0%BF%D0%BE%D0%B4%D1%80%D0%BE%D0%B1%D0%BD%D0%B5%D0%B5)
- [Настройка](#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0)
- [Использование](#%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5)
- [Лицензия](#%D0%BB%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F)

<!-- tocstop -->

## Подробнее
Навыки для Алисы можно [бесплатно размещать на Я.Облаке](https://yandex.ru/blog/dialogs/navyki-alisy-teper-mozhno-razmeschat-v-yandeks-oblake-besplatno-i-prosto) в виде функций (cloud functions).
Сделав приватный навык, можно через него проксировать запросы на любые ваши навыки, установив webhookUrl в конфиге.
Код в этом репозитории - как раз такой проксирующий навык, который нужно вставить в тело функции на Я.Облаке.

## Настройка

1. Создайте облачную функцию согласно [инструкции](https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/) для Node.js
2. Создайте в редакторе функции файл `index.js` и скопируйте туда код из [src/index.js](https://github.com/vitalets/alice-cloud-proxy/blob/master/src/index.js)
3. Создайте в редакторе функции файл конфигурации `config.js` и скопируйте туда код из [src/config.js](https://github.com/vitalets/alice-cloud-proxy/blob/master/src/config.js)
4. Сохраните изменения в функции, нажав на кнопку "Создать версию"
4. [В панели разработчика](https://yandex.ru/dev/dialogs/alice/doc/publish-docpage/#publish) заведите тестовый приватный навык, который будете использовать как прокси для других навыков
5. В настройках прокси-навыка укажите вашу функцию:
   <img src="https://user-images.githubusercontent.com/1473072/66268276-79c6c280-e844-11e9-83c5-15fe37c32583.png" width="600"> 
6. Сохраните изменения, перейдите на вкладку тестирование и проверьте, что проксирующий навык работает (должен отвечать *Please set targetUrl in config.js*):
   <img src="https://user-images.githubusercontent.com/1473072/66268399-b47d2a80-e845-11e9-97d3-11be682d94f6.png" width="600">

## Использование

1. Запустите локальную версию тестируемого навыка (например на 3000 порту)
2. Запустите [ngrok](https://ngrok.com/), чтобы сделать порт доступным извне:
   ```bash
   ngrok http -region=eu 3000
   ```
3. Скопируйте урл из вывода ngrok:

   <img src="https://user-images.githubusercontent.com/1473072/66268339-125d4280-e845-11e9-901c-488a41305ba7.png" width="600"><br>
   
   и вставьте в `config.js`:
   ```js
   module.exports = {
     targetUrl: 'http://5d7df68d.eu.ngrok.io',
     // ...
   };
   ```
4. Сохраните изменения в функции (кнопка "Создать версию")
5. Запустите проксирующий навык в приложении с Алисой - запросы пойдут на ваш локальный навык

## Лицензия
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
