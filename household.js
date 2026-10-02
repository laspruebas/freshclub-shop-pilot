import { validateSessionToken } from "./session.js";
import { AGE_GROUPS } from "./onboarding/model.js";
import { renderAgeGroupControls,renderAgeGroups as renderAgeGroupsView } from "./onboarding/render.js";
import { submitOnboardingFlow } from "./onboarding/submit.js";
import { showWizardStep,updateWizardControls } from "./onboarding/wizard.js";
const params=new URLSearchParams(window.location.search),token=params.get("t");let householdId=null,waName="",householdName="";const household={};
const statusEl=document.getElementById("status"),catalogEl=document.getElementById("household"),submitBtn=document.getElementById("submitBtn"),onboardingTitleEl=document.getElementById("onboardingTitle"),onboardingLoadingEl=document.getElementById("onboardingLoading"),onboardingSlider=document.getElementById("onboardingSlider"),stepIndicators=document.querySelectorAll("[data-step-indicator]"),householdNextBtn=document.getElementById("householdNextBtn"),addressBackBtn=document.getElementById("addressBackBtn"),addressLine1El=document.getElementById("addressLine1"),addressLine2El=document.getElementById("addressLine2"),deliveryNotesEl=document.getElementById("deliveryNotes");
function setStatus(message,type=""){statusEl.textContent=message||"";statusEl.className="status";if(type)statusEl.classList.add(type);}
function changeQty(ageGroup,delta){household[ageGroup]=Math.max(0,(household[ageGroup]||0)+delta);renderAgeGroupControls({ageGroup,quantity:household[ageGroup]});validateWizard();}
function renderAgeGroups(items){renderAgeGroupsView({items,catalogEl});}
catalogEl.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const a=b.dataset.action,id=b.dataset.id;if(!id||!a)return;if(a==="add"||a==="plus")changeQty(id,1);if(a==="minus")changeQty(id,-1);});
addressLine1El.addEventListener("input",validateWizard);householdNextBtn?.addEventListener("click",()=>goToStep(1));addressBackBtn?.addEventListener("click",()=>goToStep(0));
function goToStep(step){showWizardStep({step,onboardingSlider,stepIndicators});validateWizard();}
function validateWizard(){updateWizardControls({household,selectedDeliverySlots:[{delivery_day:"order",delivery_window:"order"}],householdNextBtn,submitBtn});if(submitBtn)submitBtn.disabled=addressLine1El.value.trim().length<5||Object.values(household).reduce((a,b)=>a+b,0)<1;}
async function resolveSessionFromToken(){if(householdId||!token)return;const data=await validateSessionToken(token);householdId=data.household_id;waName=data.wa_name||"";householdName=data.household_name||"";if(onboardingTitleEl)onboardingTitleEl.textContent=waName?`Hola ${waName}, contanos quiénes viven en tu hogar`:"Contanos quiénes viven en tu hogar";validateWizard();}
submitBtn.addEventListener("click",()=>submitOnboardingFlow({household,householdName,waName,addressLine1:addressLine1El.value.trim(),addressLine2:addressLine2El.value.trim(),deliveryNotes:deliveryNotesEl.value.trim(),setStatus,submitBtn,onboardingLoadingEl}));
async function initHouseholdPage(){try{const phone=params.get("phone");if(!phone){setStatus("Abrí este link desde WhatsApp con un teléfono válido.","error");return;}await resolveSessionFromToken();renderAgeGroups(AGE_GROUPS);goToStep(0);validateWizard();setStatus("");}catch(error){console.error("Error resolving session:",error);setStatus("No se pudo validar la sesión.","error");}}
initHouseholdPage();