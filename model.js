(function(root){
'use strict';
const PRICES=[{days:1,price:140,weight:.4},{days:7,price:350,weight:.3},{days:30,price:700,weight:.2},{days:60,price:900,weight:.05},{days:90,price:1200,weight:.04},{days:0,price:2000,weight:.01}];
// The author confirmed that hosting is the only cash expense.
const DEFAULTS={orders:50,directOrders:0,share:50,tariff:'mix',server:560,marketing:0,fee:0,support:0,newCustomers:0,purchases:2,reserve:0,investment:null};
const bounded=(x,a,b,d)=>Number.isFinite(Number(x))?Math.min(b,Math.max(a,Number(x))):d;
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function calculate(raw={}){
 const v={...DEFAULTS,...raw};
 const orders=Math.floor(bounded(v.orders,0,10000,50)),share=bounded(v.share,0,100,50);
 const price=v.tariff==='mix'?PRICES.reduce((s,p)=>s+p.price*p.weight,0):(PRICES.find(p=>String(p.days)===String(v.tariff))||PRICES[0]).price;
 const server=bounded(v.server,0,1e6,560),ownerUnit=price*share/100;
 const directOrders=Math.floor(bounded(v.directOrders,0,10000,0)),totalOrders=orders+directOrders;
 const partnerTurnover=price*orders,directTurnover=price*directOrders,turnover=partnerTurnover+directTurnover;
 const resellerRevenue=partnerTurnover*(1-share/100),ownerRevenue=turnover-resellerRevenue;
 const purchases=bounded(v.purchases,1,100,2),unitContribution=totalOrders?ownerRevenue/totalOrders:ownerUnit;
 const investment=v.investment===null||v.investment===''?null:bounded(v.investment,0,1e9,0);
 const result=ownerRevenue-server;
 return {orders,directOrders,totalOrders,share,price:round(price),server,quarterServer:round(server*3),annualServer:round(server*12),marketing:0,fee:0,support:0,newCustomers:0,purchases,reservePct:0,
 partnerTurnover:round(partnerTurnover),directTurnover:round(directTurnover),turnover:round(turnover),ownerRevenue:round(ownerRevenue),resellerRevenue:round(resellerRevenue),ownerUnit:round(ownerUnit),feeUnit:0,contribution:round(unitContribution),directUnit:round(price),variableUnit:round(totalOrders?resellerRevenue/totalOrders:price-ownerUnit),variableTotal:round(resellerRevenue),grossProfit:round(ownerRevenue),fees:0,supportTotal:0,fixed:server,cashExpenses:server,result:round(result),
 reserve:0,budget:server,breakEven:unitContribution>0?Math.ceil(server/unitContribution):server===0?0:null,
 investment,payback:investment!==null&&result>0?round(investment/result):null,burnRate:server,
 cac:null,ltv:round(unitContribution*purchases),margin:ownerRevenue>0?round(result/ownerRevenue*100):null,cashReceiptRequired:round(ownerRevenue)};
}
function financialRows(m){return [
 ['Цена / средний чек','Тариф или взвешенный чек','price','money'],
 ['Продажи за месяц','Через партнёров + напрямую','totalOrders','number'],
 ['Выручка / оборот сети','Цена × все продажи','turnover','money'],
 ['Переменные расходы на 1 продажу','Доля реселлеров / все продажи','variableUnit','money'],
 ['Расходы на продвижение и продажи','Чек × продажи партнёров × (1 − моя доля)','variableTotal','money'],
 ['Маржа на продажу','Цена − переменные расходы','contribution','money'],
 ['Постоянные расходы','Только сервер','fixed','money'],
 ['Валовая прибыль','Оборот − расходы на продвижение и продажи','grossProfit','money'],
 ['Прибыль до налогов','Валовая прибыль − сервер','result','money'],
 ['Безубыточность, продаж','Сервер / маржа, вверх','breakEven','number']
 ];}
const api={PRICES,DEFAULTS,calculate,financialRows};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ProjectFinance=api;
})(typeof window!=='undefined'?window:globalThis);
