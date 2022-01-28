/**
 * @author Helge_0x00
 *
 * [Panel]
 * dlercloud = script-name=dlercloud,title=Dler Cloud,style=alert,content=请刷新面板,update-interval=1800
 *
 * [Script]
 * dlercloud = type=generic,script-path=https://gist.githubusercontent.com/Hyseen/0716d9a1e3a48196927cf89271fd8f10/raw/dler.js,argument=email=你的邮箱&passwd=URLEncode(你的密码)&multiple=0&autoCheckin=false
 *
 * 支持使用脚本使用 argument 参数自定义配置，如：argument=key1=URLEncode(value1)&key2=URLEncode(value2)，具体参数如下所示，
 * email: 邮箱
 * passwd: 密码
 * multiple: 签到倍率，为 0 表示不签到
 * autoCheckin: 是否自动签到，true 为开启自动签到，false 为隔壁自动签到，手动点击面板刷新按钮时签到
 */
const DEFAULT_OPTIONS = {
  email: folooox@gmail.com,
  passwd: shunjian5588,
  multiple: 1,
  autoCheckin: false
};

let { email, passwd, multiple, autoCheckin } = getOptions();

let panel = {
  title: "Dler Cloud"
};

(async () => {
  if (
    multiple > 0 &&
    (autoCheckin == "true" || autoCheckin === true || $trigger === "button")
  ) {
    let checkin = await dlerCheckin(email, passwd, multiple).catch(() => {});
    if (checkin) {
      $notification.post("Dler Cloud 签到", "", checkin);
    }
  }

  let { plan, plan_time, used, traffic } = await getDlerInfomation(
    email,
    passwd
  );
  let expireTime = new Date(plan_time.replaceAll(" ", "T") + "+08:00");
  let remainDays = Math.ceil(
    (expireTime.getTime() - new Date().getTime()) / 1000 / 60 / 60 / 24
  );
  let content = `当前套餐 ➟ ${plan}\n到期时间 ➟ ${formatDate(
    expireTime
  )} | ${remainDays} 天\n已用流量 ➟ ${used} | ${traffic}`;
  panel["content"] = content;
  panel["icon"] = "airplane.circle.fill";
})()
  .catch(error => {
    console.log(error);
    panel["content"] = error;
    panel["icon"] = "exclamationmark.arrow.triangle.2.circlepath";
    panel["icon-color"] = "#fbd306";
  })
  .finally(() => {
    $done(panel);
  });

function getDlerInfomation(email, passwd) {
  return new Promise((resolve, reject) => {
    let options = {
      url: "https://m.ok6.icu/m/home",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, passwd })
    };

    $httpClient.post(options, (error, response, data) => {
      if (error || response.status !== 200) {
        console.log(error);
        reject("网络异常，请检查网络连接");
        return;
      }

      console.log(data);

      result = JSON.parse(data);
      if (result.ret === 200) {
        resolve(result.data);
      } else {
        console.log(`获取用户信息失败：${JSON.stringify(result)}`);
        reject("请检查邮箱/密码是否正确");
      }
    });
  });
}

function dlerCheckin(email, passwd, multiple = 1) {
  return new Promise((resolve, reject) => {
    let options = {
      url: `https://m.ok6.icu/m/home/checkin`,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, passwd, multiple })
    };

    $httpClient.post(options, (error, response, data) => {
      if (error || response.status !== 200) {
        console.log(error);
        reject("网络异常，请检查网络连接");
        return;
      }

      result = JSON.parse(data);
      if (result.ret === 200) {
        resolve(result?.data?.checkin ?? undefined);
      } else {
        console.log(`签到失败：${JSON.stringify(result)}`);
        reject(result?.msg);
      }
    });
  });
}

function formatDate(date) {
  console.log(typeof date);
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOptions() {
  let options = Object.assign({}, DEFAULT_OPTIONS);
  if (typeof $argument != "undefined") {
    try {
      let params = Object.fromEntries(
        $argument
          .split("&")
          .map(item => item.split("="))
          .map(([k, v]) => [k, decodeURIComponent(v)])
      );
      Object.assign(options, params);
    } catch (error) {
      console.error(`$argument 解析失败，$argument: + ${argument}`);
    }
  }

  return options;
}
