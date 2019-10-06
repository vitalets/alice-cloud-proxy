# alice-cloud-proxy

Универсальная [облачная функция](https://cloud.yandex.ru/docs/functions/concepts/function) для проксирования запросов на заданный урл.
Позволяет тестировать локальную версию навыка прямо в приложениях с Алисой.

<!-- toc -->

- [Подробнее](#%D0%BF%D0%BE%D0%B4%D1%80%D0%BE%D0%B1%D0%BD%D0%B5%D0%B5)
- [Настройка](#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0)
- [Использование](#%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5)
- [Известные проблемы](#%D0%B8%D0%B7%D0%B2%D0%B5%D1%81%D1%82%D0%BD%D1%8B%D0%B5-%D0%BF%D1%80%D0%BE%D0%B1%D0%BB%D0%B5%D0%BC%D1%8B)
- [Лицензия](#%D0%BB%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F)

<!-- tocstop -->

## Подробнее
Навыки для Алисы можно [бесплатно размещать на Я.Облаке](https://yandex.ru/blog/dialogs/navyki-alisy-teper-mozhno-razmeschat-v-yandeks-oblake-besplatno-i-prosto) в виде функций (cloud functions).
Сделав приватный навык, можно через него проксировать запросы на любые ваши навыки, передав урл в качестве переменной окружения.
Код в этом репозитории - как раз такой проксирующий навык, который нужно вставить в тело функции на Я.Облаке.
Код написан для Node.js, но ваш навык может быть на любом языке.

## Настройка

1. Создайте облачную функцию согласно [инструкции](https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/) для Node.js
2. Скопируйте полностью код файла [src/index.js](https://github.com/vitalets/alice-cloud-proxy/blob/master/src/index.js) из этого репозитория и вставьте в `index.js` для функции
3. Сохраните изменения в функции, нажав на кнопку "Создать версию"
4. [В панели разработчика](https://yandex.ru/dev/dialogs/alice/doc/publish-docpage/#publish) заведите тестовый приватный навык, который будете использовать как прокси для других навыков
5. В настройках прокси-навыка укажите вашу функцию:
   <img src="https://user-images.githubusercontent.com/1473072/66268276-79c6c280-e844-11e9-83c5-15fe37c32583.png" width="600"> 
6. Сохраните изменения, перейдите на вкладку тестирование и проверьте, что проксирующий навык работает (должен отвечать *Please set TARGET_URL in environment*):
   <img src="https://user-images.githubusercontent.com/1473072/66268399-b47d2a80-e845-11e9-97d3-11be682d94f6.png" width="600">
7. Настройка завершена

## Использование

1. Запустите локальную версию тестируемого навыка (например на 3000 порту)
2. Запустите [ngrok](https://ngrok.com/), чтобы сделать порт доступным извне:
   ```bash
   ngrok http -region=eu 3000
   ```
3. Скопируйте урл из вывода ngrok:
   <img src="https://user-images.githubusercontent.com/1473072/66268339-125d4280-e845-11e9-901c-488a41305ba7.png" width="600"><br>
   и вставьте в качестве переменной окружения `TARGET_URL` для функции:
   <img src="https://user-images.githubusercontent.com/1473072/66268591-839df500-e847-11e9-9826-c3aa8543f0ad.png" width="600">
4. Сохраните изменения в функции 
5. Запустите проксирующий навык в приложении с Алисой и проверяйте свой навык

## Известные проблемы
1. Иногда прилетает вот такой ответ, но на следующий запрос все хорошо
   <img src="https://user-images.githubusercontent.com/1473072/66269239-e34bce80-e84e-11e9-9aaf-d116e50dfb2c.png" width="300">

## Лицензия
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
