# alice-cloud-proxy

Готовая [облачная функция](https://cloud.yandex.ru/docs/functions/concepts/function) 
для проксирования запросов в основной вебхук навыка.

## Зачем это нужно?
- при ошибках основного вебхука функция вернет корректный ответ (не происходит выхода из навыка)
- при таймауте основного вебхука функция также вернет корректный ответ (текст можно настраивать) 
- при пинг-запросах от серверов яндекса функция ответит сама, и до вашего кода они не дойдут (не сжигают ваш траффик)

## Настройка

1. Создайте облачную функцию согласно [инструкции](https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/) для Node.js
2. Создайте в редакторе функции файл `index.js` и скопируйте туда код из [src/index.js](https://github.com/vitalets/alice-cloud-proxy/blob/master/src/index.js)
3. Создайте в редакторе функции файл конфигурации `config.js` и скопируйте туда код из [src/config.js](https://github.com/vitalets/alice-cloud-proxy/blob/master/src/config.js).
   Измените необходимые параметры под себя
4. Укажите точку входа функции: `index.handler`
5. Сохраните изменения в функции, нажав на кнопку "Создать версию"
6. [В панели разработчика](https://yandex.ru/dev/dialogs/alice/doc/publish-docpage/#publish) создайте навык и в настройках укажите вашу функцию:
   <img src="https://user-images.githubusercontent.com/1473072/66268276-79c6c280-e844-11e9-83c5-15fe37c32583.png" width="600"> 

## Лицензия
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
