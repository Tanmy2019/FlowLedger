export const typeLabels: Record<string, string> = {
  expense: "支出",
  income: "收入",
  transfer: "转账",
};

export const accountTypeLabels: Record<string, string> = {
  cash: "现金",
  bank: "银行卡",
  credit: "信用卡",
  alipay: "支付宝",
  wechat: "微信",
  investment: "投资账户",
  liability: "负债账户",
};

export const periodLabels: Record<string, string> = {
  monthly: "每月",
  yearly: "每年",
};

export const matchModeLabels: Record<string, string> = {
  all: "全部满足",
  any: "满足任一",
};

export const fieldLabels: Record<string, string> = {
  note: "备注",
  merchant: "商户",
  amount: "金额",
};

export const operatorLabels: Record<string, string> = {
  contains: "包含",
  equals: "等于",
  startsWith: "开头是",
  regex: "正则匹配",
};
