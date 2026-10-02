import { validateSessionToken } from "./session.js";
import { fetchDeliverySlots as fetchDeliverySlotsApi } from "./onboarding/api.js";
import { AGE_GROUPS } from "./onboarding/model.js";
import { renderAgeGroupControls,renderAgeGroups as renderAgeGroupsView,renderDeliverySlots as renderDeliverySlotsView,renderDeliverySummary as renderDeliverySummaryView } from "./onboarding/render.js";
import { submitOnboardingFlow } from "./onboarding/submit.js";
import { selectDeliverySlot,showWizardStep,updateWizardControls } from "./onboarding/wizard.js";
const params=new URLSearchParams(window.location.search),token=params.get("t");let householdId=null,waName="",householdName="",deliverySlots=[],selectedDeliverySlots=[];const household={};
const statusEl=document.getElementById("status"),catalogEl=document.getElementById("household"),submitBtn=document.getElementById("submitBtn"),onboardingTitleEl=document.getElementById("onboardingTitle"),deliverySlotsEl=document.getElementById("deliverySlots"),deliverySummaryEl=document.getElementById("deliverySummary"),onboardingLoadingEl=document.getElementById("onboardingLoading"),onboardingSlider=document.getElementById("onboardingSlider"),stepIndicators=document.querySelectorAll("[data-step-indicator]"),householdNextBtn=document.getElementById("householdNextBtn"),addressNextBtn=document.getElementById("addressNextBtn"),addressBackBtn=document.getElementById("addressBackBtn"),deliveryBackBtn=document.getElementById("deliveryBackBtn"),addressLine1El=document.getElementById("addressLine1"),addressLine2El=document.getElementById("addressLine2"),deliveryNotesEl=document.getElementById("deliveryNotes");
function setStatus(message,type=""){statusEl.textContent=message||"";statusEl.className="status";if(type)statusEl.classList.add(type);}
function changeQty(ageGroup,delta){const next=Math.max(0,(household[ageGroup]||0)+delta);household[ageGroup]=next;renderAgeGroupControls({ageGroup,quantity:next});validateWizard();}
function renderAgeGroups(items){renderAgeGroupsView({items,catalogEl});}
catalogEl.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const a=b.dataset.action,id=b.dataset.id;if(!id||!a)return;if(a==="add"||a==="plus")changeQty(id,1);if(a==="minus")changeQty(id,-1);});
deliverySlotsEl.addEventListener("click",e=>{const b=e.target.closest(".delivery-slot-btn");if(!b)return;toggleDeliverySlot(b.dataset.day,b.dataset.window);});
addressLine1El.addEventListener("input",validateWizard);
householdNextBtn?.addEventListener("click",()=>goToStep(1));addressBackBtn?.addEventListener("click",()=>goToStep(0));addressNextBtn?.addEventListener("click",async()=>{if(deliverySlots.length===0)await fetchDeliverySlots();goToStep(2);});deliveryBackBtn?.addEventListener("click",()=>goToStep(1));
function renderDeliverySlots(slots){deliverySlots=[...(slots||[])];renderDeliverySlotsView({slots:deliverySlots,selectedDeliverySlots,deliverySlotsEl});renderDeliverySummary();}
function renderDeliverySummary(){renderDeliverySummaryView({selectedDeliverySlots,deliverySummaryEl});}
function toggleDeliverySlot(dayCode,windowCode){selectedDeliverySlots=selectDeliverySlot({deliverySlots,selectedDeliverySlots,dayCode,windowCode});renderDeliverySlots(deliverySlots);validateWizard();}
function goToStep(step){showWizardStep({step,onboardingSlider,stepIndicators});validateWizard();}
function validateWizard(){updateWizardControls({household,selectedDeliverySlots,householdNextBtn,submitBtn});if(addressNextBtn)addressNextBtn.disabled=addressLine1El.value.trim().length<5;}
async function resolveSessionFromToken(){if(householdId||!token)return;const data=await validateSessionToken(token);householdId=data.household_id;waName=data.wa_name||"";householdName=data.household_name||"";if(onboardingTitleEl)onboardingTitleEl.textContent=waName?`Hola ${waName}, contanos quiénes viven en tu hogar`:"Contanos quiénes viven en tu hogar";validateWizard();}
async function fetchDeliverySlots(){const data=await fetchDeliverySlotsApi();renderDeliverySlots(data.slots||[]);}
submitBtn.addEventListener("click",()=>submitOnboardingFlow({household,householdName,waName,selectedDeliverySlots,addressLine1:addressLine1El.value.trim(),addressLine2:addressLine2El.value.trim(),deliveryNotes:deliveryNotesEl.value.trim(),setStatus,submitBtn,onboardingLoadingEl}));
async function initHouseholdPage(){try{const phone=new URLSearchParams(window.location.search).get("phone");if(!phone){setStatus("Abrí este link desde WhatsApp con un teléfono válido.","error");return;}await resolveSessionFromToken();renderAgeGroups(AGE_GROUPS);goToStep(0);validateWizard();setStatus("");}catch(error){console.error("Error resolving session:",error);setStatus("No se pudo validar la sesión.","error");}}
initHouseholdPage();