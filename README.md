# alice-cloud-proxy

Универсальная облачная функция для [Я.Облака](https://cloud.yandex.ru), которая проксирует запросы на заданный урл.
Позволяет тестировать локальную версию навыка прямо в приложениях с Алисой.

## Подробнее
Навыки для Алисы можно [бесплатно размещать на Я.Облаке](https://yandex.ru/blog/dialogs/navyki-alisy-teper-mozhno-razmeschat-v-yandeks-oblake-besplatno-i-prosto) в виде функций (cloud functions).
Сделав приватный навык, можно через него проксировать запросы на любые ваши навыки, передав урл в качестве переменной окружения.
Код в этом репозитории - как раз такой проксирующий навык, который нужно вставить в тело функции на Я.Облаке.
Проксирующий навык написан для Node.js, но ваш навык куда проксируем может быть на любом языке.

## Настройка

1. Создайте облачную функцию согласно [инструкции](https://yandex.ru/dev/dialogs/alice/doc/deploy-ycloud-function-docpage/) для Node.js
2. Скопируйте полностью код файла [src/index.js](https://github.com/vitalets/alice-cloud-proxy/blob/master/src/index.js) из этого репозитория и вставьте в `index.js` для функции
3. Сохраните изменения в функции, нажав на кнопку "Создать версию"
4. [В панели разработчика](https://yandex.ru/dev/dialogs/alice/doc/publish-docpage/#publish) заведите тестовый приватный навык, который будете использовать как прокси для других навыков
5. В настройках прокси-навыка укажите вашу функцию:
   <img src="https://user-images.githubusercontent.com/1473072/66268276-79c6c280-e844-11e9-83c5-15fe37c32583.png" width="600"> 
6. Сохраните изменения, перейдите на вкладку тестирование и проверьте, что проксирующий навык работает (должен отвечать `Please set TARGET_URL in environment`):
   <img src="https://user-images.githubusercontent.com/1473072/66268399-b47d2a80-e845-11e9-97d3-11be682d94f6.png" width="600">

## Использование

1. Запустите локальную версию тестируемого навыка (например на 3000 порту)
2. Запустите [ngrok](https://ngrok.com/), чтобы сделать порт доступным извне:
   ```bash
   ngrok http -region=eu 3000
   ```
3. <details>
    <summary>Скопируйте урл из вывода ngrok и вставьте в качестве переменной окружения <code>TARGET_URL</code>для функции:</summary>
    <img src="https://user-images.githubusercontent.com/1473072/66268339-125d4280-e845-11e9-901c-488a41305ba7.png" width="600">
    В окне управления функцией:
     <img src="https://user-images.githubusercontent.com/1473072/66268591-839df500-e847-11e9-9826-c3aa8543f0ad.png" width="600">
  </details>
 
4. Сохраните изменения в функции 
5. Запустите проксирующий навык в приложении с Алисой и проверяйте свой навык

## Лицензия
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
