import { createOrder,fetchOrderDashboard } from "./api.js";
import { renderOrderDashboard } from "./dashboard.js";
import { getNextDeliveryMessage } from "./delivery.js";
import { buildOrderItems,basketEstimatedTotal,formatARS } from "./model.js";
export async function submitOrderFlow({householdId,orderState,setStatus,submitBtn,reportLoadingEl,reportLoadingTitleEl,orderListEl,extrasBlockEl,manualSearchBlockEl,headerEl,pedidoSummaryEl}){
 if(!householdId){setStatus("Falta household_id en la URL.","error");return;}const items=buildOrderItems(orderState);if(!items.length){setStatus("Elegí al menos un producto.","error");return;}
 const payload={household_id:householdId,channel:"whatsapp_external_link",items};
 try{reportLoadingTitleEl.innerHTML=`<span class="report-loading-done">Listo!</span><span class="report-loading-message">${getNextDeliveryMessage()}</span>`;reportLoadingEl.classList.remove("hidden");submitBtn.disabled=true;const data=await createOrder(payload),orderId=data?.order_id||"";if(!orderId)throw new Error("Order created without order_id");
 const dashboardData=await fetchOrderDashboard(orderId);orderListEl.innerHTML="";if(extrasBlockEl)extrasBlockEl.style.display="none";if(manualSearchBlockEl)manualSearchBlockEl.style.display="none";submitBtn.closest(".footer")?.remove();
 let deliverySchedule=[],deliveryAddress={};try{deliverySchedule=JSON.parse(sessionStorage.getItem("delivery_schedule")||"[]");deliveryAddress=JSON.parse(sessionStorage.getItem("delivery_address")||"{}");}catch{}
 renderOrderDashboard(dashboardData,{headerEl,pedidoSummaryEl,orderListEl,orderTotal:basketEstimatedTotal(orderState),formatTotal:formatARS,deliverySchedule,deliveryAddress});setTimeout(()=>reportLoadingEl.classList.add("hidden"),300);
 }catch(error){console.error("Error creating order:",error);reportLoadingEl?.classList.add("hidden");setStatus("No se pudo crear la orden.","error");submitBtn.disabled=false;}
}