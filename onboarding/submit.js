import { completeOnboarding } from "./api.js";
import { buildMembersPayload } from "./model.js";
export async function submitOnboardingFlow({household,householdName,waName,addressLine1,addressLine2,deliveryNotes,setStatus,submitBtn,onboardingLoadingEl,storage=sessionStorage,location=window.location}){
 const members=buildMembersPayload(household),household_name=householdName||`${waName||"Mi"} hogar`;
 if(!members.length){setStatus("Elegí al menos una persona.","error");return;}if(!addressLine1||addressLine1.trim().length<5){setStatus("Ingresá la dirección de entrega.","error");return;}
 const params=new URLSearchParams(location.search),phone=params.get("phone"),referral_code=params.get("ref")||storage.getItem("referral_code");if(!phone){setStatus("Falta teléfono en la URL.","error");return;}
 const payload={phone,household_name,members,address_line1:addressLine1.trim(),address_line2:addressLine2?.trim()||null,city:"CABA",delivery_notes:deliveryNotes?.trim()||null,...(referral_code?{referral_code}:{})};
 try{submitBtn.disabled=true;setStatus("");onboardingLoadingEl?.classList.remove("hidden");storage.setItem("delivery_address",JSON.stringify({address_line1:payload.address_line1,address_line2:payload.address_line2,city:payload.city,delivery_notes:payload.delivery_notes}));const data=await completeOnboarding(payload);location.href=data.pedido_url;}catch(error){console.error("Error saving onboarding:",error);onboardingLoadingEl?.classList.add("hidden");setStatus("No se pudieron guardar los datos del hogar.","error");submitBtn.disabled=false;}
}