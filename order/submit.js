import { createOrder,fetchOrderDashboard } from "./api.js";
import { renderOrderDashboard } from "./dashboard.js";
import { buildOrderItems,basketEstimatedTotal,formatARS } from "./model.js";

export async function submitOrderFlow({householdId,orderState,deliveryChoice,setStatus,submitBtn,reportLoadingEl,reportLoadingTitleEl,orderListEl,extrasBlockEl,manualSearchBlockEl,headerEl,pedidoSummaryEl}){
  if(!householdId){setStatus("Falta household_id en la URL.","error");return;}
  const items=buildOrderItems(orderState);
  if(!items.length){setStatus("Elegí al menos un producto.","error");return;}
  if(!deliveryChoice?.date||!deliveryChoice?.window){setStatus("Elegí cuándo querés recibir el pedido.","error");return;}

  const payload={household_id:householdId,channel:"whatsapp_external_link",items,delivery_date:deliveryChoice.date,delivery_window:deliveryChoice.window};
  reportLoadingTitleEl.textContent="Confirmando tu pedido...";
  reportLoadingEl.classList.remove("hidden");
  submitBtn.disabled=true;

  let data;
  try{
    data=await createOrder(payload);
  }catch(error){
    console.error("Error creating order:",error);
    reportLoadingEl?.classList.add("hidden");
    setStatus("No se pudo crear la orden.","error");
    submitBtn.disabled=false;
    return;
  }

  const orderId=data?.order_id||"";
  if(!orderId){
    console.error("Order created without order_id",data);
    reportLoadingEl?.classList.add("hidden");
    setStatus("El pedido fue recibido, pero no pudimos abrir la confirmación.","error");
    return;
  }

  // From this point on the order is already persisted. A dashboard/report failure
  // must never be presented as an order-creation failure or enable a duplicate submit.
  try{
    const dashboardData=await fetchOrderDashboard(orderId);
    orderListEl.innerHTML="";
    if(extrasBlockEl)extrasBlockEl.style.display="none";
    if(manualSearchBlockEl)manualSearchBlockEl.style.display="none";
    submitBtn.closest(".footer")?.remove();
    let deliveryAddress={};
    try{deliveryAddress=JSON.parse(sessionStorage.getItem("delivery_address")||"{}");}catch{}
    const deliverySchedule=[{delivery_day:deliveryChoice.date,delivery_window:deliveryChoice.window}];
    renderOrderDashboard(dashboardData,{headerEl,pedidoSummaryEl,orderListEl,orderTotal:basketEstimatedTotal(orderState),formatTotal:formatARS,deliverySchedule,deliveryAddress});
    setStatus("");
  }catch(error){
    console.error("Order confirmed but dashboard failed:",error);
    // Keep the checkout locked: the order already exists.
    orderListEl.innerHTML="";
    if(extrasBlockEl)extrasBlockEl.style.display="none";
    if(manualSearchBlockEl)manualSearchBlockEl.style.display="none";
    submitBtn.closest(".footer")?.remove();
    if(headerEl) headerEl.innerHTML='<div class="brand">FRUTI</div><h1 class="pedido-title">Pedido confirmado</h1><p class="subtitle">Ya recibimos tu pedido.</p>';
    if(pedidoSummaryEl) pedidoSummaryEl.innerHTML=`<section class="pedido-summary-card"><p class="onboarding-eyebrow">LISTO</p><h2>Tu pedido está confirmado</h2><p>Entrega: ${deliveryChoice.date} · ${deliveryChoice.window.replace("-","–")} h</p><p>El reporte de tu semana no pudo cargarse ahora, pero esto no afecta tu pedido.</p></section>`;
    setStatus("");
  }finally{
    setTimeout(()=>reportLoadingEl?.classList.add("hidden"),300);
  }
}