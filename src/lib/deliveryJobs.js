export function wallet(){return Math.max(0,Number(localStorage.getItem('kukirin_cash'))||0);}
export function payDelivery(id,amount){
 let paid;try{paid=JSON.parse(localStorage.getItem('kukirin_paid_deliveries')||'[]');}catch{paid=[];}
 if(paid.includes(id))return 0;const reward=Math.max(0,Math.round(amount));
 localStorage.setItem('kukirin_paid_deliveries',JSON.stringify([...paid,id].slice(-500)));
 localStorage.setItem('kukirin_cash',String(wallet()+reward));return reward;
}
export function newDelivery(){return {id:'uber_'+crypto.randomUUID(),delivery:true,icon:null,title:'Uber Eats · restaurant → customer',titleEt:'Uber Eats · restoran → klient',from:'Restaurant',fromEt:'Restoran',to:'Customer',toEt:'Klient',distance:.65,time:180,reward:24,color:'#06c167'};}
