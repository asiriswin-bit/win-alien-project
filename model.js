(function(root){
'use strict';
const PRICES=[{days:1,price:140,weight:.4},{days:7,price:350,weight:.3},{days:30,price:700,weight:.2},{days:60,price:900,weight:.05},{days:90,price:1200,weight:.04},{days:0,price:2000,weight:.01}];
// The author confirmed that hosting is the only cash expense.
const DEFAULTS={orders:50,share:50,tariff:'mix',server:560,marketing:0,fee:0,support:0,newCustomers:0,purchases:2,reserve:0,hours:80,hourRate:400};
const bounded=(x,a,b,d)=>Number.isFinite(Number(x))?Math.min(b,Math.max(a,Number(x))):d;
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function calculate(raw={}){
 const v={...DEFAULTS,...raw};
 const orders=Math.floor(bounded(v.orders,0,10000,50)),share=bounded(v.share,0,100,50);
 const price=v.tariff==='mix'?PRICES.reduce((s,p)=>s+p.price*p.weight,0):(PRICES.find(p=>String(p.days)===String(v.tariff))||PRICES[0]).price;
 const server=bounded(v.server,0,1e6,560),ownerUnit=price*share/100;
 const purchases=bounded(v.purchases,1,100,2),turnover=price*orders,ownerRevenue=ownerUnit*orders;
 const result=ownerRevenue-server,labor=bounded(v.hours,0,10000,80)*bounded(v.hourRate,0,1e5,400);
 return {orders,share,price:round(price),server,quarterServer:round(server*3),annualServer:round(server*12),marketing:0,fee:0,support:0,newCustomers:0,purchases,reservePct:0,
 turnover:round(turnover),ownerRevenue:round(ownerRevenue),resellerRevenue:round(turnover-ownerRevenue),ownerUnit:round(ownerUnit),feeUnit:0,contribution:round(ownerUnit),fees:0,supportTotal:0,fixed:server,cashExpenses:server,result:round(result),
 reserve:0,budget:server,labor:round(labor),economicBudget:round(server+labor),breakEven:ownerUnit>0?Math.ceil(server/ownerUnit):server===0?0:null,
 cac:null,ltv:round(ownerUnit*purchases),margin:ownerRevenue>0?round(result/ownerRevenue*100):null,cashReceiptRequired:round(ownerRevenue)};
}
const api={PRICES,DEFAULTS,calculate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ProjectFinance=api;
})(typeof window!=='undefined'?window:globalThis);
