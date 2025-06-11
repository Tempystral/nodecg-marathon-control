import{B as A,g as C,i as z,a as T,b as H,c as m,o as g,d as f,e as w,m as p,f as I,r as P,w as K,F as N,h as F,t as k,j as v,k as E,u as h,n as U,l as W}from"./template-B7mIJyMN.js";import{S as j,m as O,a as X}from"./mdi-DijnHO2G.js";import{u as L}from"./index-BKeW9xLa.js";import{c as R,s as Y}from"./index-BsBjbnQ5.js";import{s as G}from"./index-CP7O6Pun.js";import{s as q}from"./index-CsN3hG7y.js";import{s as J}from"./index-HWtEkumF.js";import{N as V}from"./utils-Kch31FIc.js";var Q=({dt:e})=>`
.p-slider {
    position: relative;
    background: ${e("slider.track.background")};
    border-radius: ${e("slider.track.border.radius")};
}

.p-slider-handle {
    cursor: grab;
    touch-action: none;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${e("slider.handle.height")};
    width: ${e("slider.handle.width")};
    background: ${e("slider.handle.background")};
    border-radius: ${e("slider.handle.border.radius")};
    transition: background ${e("slider.transition.duration")}, color ${e("slider.transition.duration")}, border-color ${e("slider.transition.duration")}, box-shadow ${e("slider.transition.duration")}, outline-color ${e("slider.transition.duration")};
    outline-color: transparent;
}

.p-slider-handle::before {
    content: "";
    width: ${e("slider.handle.content.width")};
    height: ${e("slider.handle.content.height")};
    display: block;
    background: ${e("slider.handle.content.background")};
    border-radius: ${e("slider.handle.content.border.radius")};
    box-shadow: ${e("slider.handle.content.shadow")};
    transition: background ${e("slider.transition.duration")};
}

.p-slider:not(.p-disabled) .p-slider-handle:hover {
    background: ${e("slider.handle.hover.background")};
}

.p-slider:not(.p-disabled) .p-slider-handle:hover::before {
    background: ${e("slider.handle.content.hover.background")};
}

.p-slider-handle:focus-visible {
    box-shadow: ${e("slider.handle.focus.ring.shadow")};
    outline: ${e("slider.handle.focus.ring.width")} ${e("slider.handle.focus.ring.style")} ${e("slider.handle.focus.ring.color")};
    outline-offset: ${e("slider.handle.focus.ring.offset")};
}

.p-slider-range {
    display: block;
    background: ${e("slider.range.background")};
    border-radius: ${e("slider.track.border.radius")};
}

.p-slider.p-slider-horizontal {
    height: ${e("slider.track.size")};
}

.p-slider-horizontal .p-slider-range {
    inset-block-start: 0;
    inset-inline-start: 0;
    height: 100%;
}

.p-slider-horizontal .p-slider-handle {
    inset-block-start: 50%;
    margin-block-start: calc(-1 * calc(${e("slider.handle.height")} / 2));
    margin-inline-start: calc(-1 * calc(${e("slider.handle.width")} / 2));
}

.p-slider-vertical {
    min-height: 100px;
    width: ${e("slider.track.size")};
}

.p-slider-vertical .p-slider-handle {
    inset-inline-start: 50%;
    margin-inline-start: calc(-1 * calc(${e("slider.handle.width")} / 2));
    margin-block-end: calc(-1 * calc(${e("slider.handle.height")} / 2));
}

.p-slider-vertical .p-slider-range {
    inset-block-end: 0;
    inset-inline-start: 0;
    width: 100%;
}
`,Z={handle:{position:"absolute"},range:{position:"absolute"}},_={root:function(n){var t=n.instance,a=n.props;return["p-slider p-component",{"p-disabled":a.disabled,"p-invalid":t.$invalid,"p-slider-horizontal":a.orientation==="horizontal","p-slider-vertical":a.orientation==="vertical"}]},range:"p-slider-range",handle:"p-slider-handle"},ee=A.extend({name:"slider",style:Q,classes:_,inlineStyles:Z}),ne={name:"BaseSlider",extends:J,props:{min:{type:Number,default:0},max:{type:Number,default:100},orientation:{type:String,default:"horizontal"},step:{type:Number,default:null},range:{type:Boolean,default:!1},tabindex:{type:Number,default:0},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:ee,provide:function(){return{$pcSlider:this,$parentInstance:this}}};function b(e){"@babel/helpers - typeof";return b=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(n){return typeof n}:function(n){return n&&typeof Symbol=="function"&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n},b(e)}function te(e,n,t){return(n=ae(n))in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function ae(e){var n=ie(e,"string");return b(n)=="symbol"?n:n+""}function ie(e,n){if(b(e)!="object"||!e)return e;var t=e[Symbol.toPrimitive];if(t!==void 0){var a=t.call(e,n);if(b(a)!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(n==="string"?String:Number)(e)}function re(e){return de(e)||oe(e)||le(e)||se()}function se(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function le(e,n){if(e){if(typeof e=="string")return S(e,n);var t={}.toString.call(e).slice(8,-1);return t==="Object"&&e.constructor&&(t=e.constructor.name),t==="Map"||t==="Set"?Array.from(e):t==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?S(e,n):void 0}}function oe(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function de(e){if(Array.isArray(e))return S(e)}function S(e,n){(n==null||n>e.length)&&(n=e.length);for(var t=0,a=Array(n);t<n;t++)a[t]=e[t];return a}var $={name:"Slider",extends:ne,inheritAttrs:!1,emits:["change","slideend"],dragging:!1,handleIndex:null,initX:null,initY:null,barWidth:null,barHeight:null,dragListener:null,dragEndListener:null,beforeUnmount:function(){this.unbindDragListeners()},methods:{updateDomData:function(){var n=this.$el.getBoundingClientRect();this.initX=n.left+T(),this.initY=n.top+H(),this.barWidth=this.$el.offsetWidth,this.barHeight=this.$el.offsetHeight},setValue:function(n){var t,a=n.touches?n.touches[0].pageX:n.pageX,s=n.touches?n.touches[0].pageY:n.pageY;this.orientation==="horizontal"?z(this.$el)?t=(this.initX+this.barWidth-a)*100/this.barWidth:t=(a-this.initX)*100/this.barWidth:t=(this.initY+this.barHeight-s)*100/this.barHeight;var i=(this.max-this.min)*(t/100)+this.min;if(this.step){var r=this.range?this.value[this.handleIndex]:this.value,y=i-r;y<0?i=r+Math.ceil(i/this.step-r/this.step)*this.step:y>0&&(i=r+Math.floor(i/this.step-r/this.step)*this.step)}else i=Math.floor(i);this.updateModel(n,i)},updateModel:function(n,t){var a=Math.round(t*100)/100,s;this.range?(s=this.value?re(this.value):[],this.handleIndex==0?(a<this.min?a=this.min:a>=this.max&&(a=this.max),s[0]=a):(a>this.max?a=this.max:a<=this.min&&(a=this.min),s[1]=a)):(a<this.min?a=this.min:a>this.max&&(a=this.max),s=a),this.writeValue(s,n),this.$emit("change",s)},onDragStart:function(n,t){this.disabled||(this.$el.setAttribute("data-p-sliding",!0),this.dragging=!0,this.updateDomData(),this.range&&this.value[0]===this.max?this.handleIndex=0:this.handleIndex=t,n.currentTarget.focus())},onDrag:function(n){this.dragging&&this.setValue(n)},onDragEnd:function(n){this.dragging&&(this.dragging=!1,this.$el.setAttribute("data-p-sliding",!1),this.$emit("slideend",{originalEvent:n,value:this.value}))},onBarClick:function(n){this.disabled||C(n.target,"data-pc-section")!=="handle"&&(this.updateDomData(),this.setValue(n))},onMouseDown:function(n,t){this.bindDragListeners(),this.onDragStart(n,t)},onKeyDown:function(n,t){switch(this.handleIndex=t,n.code){case"ArrowDown":case"ArrowLeft":this.decrementValue(n,t),n.preventDefault();break;case"ArrowUp":case"ArrowRight":this.incrementValue(n,t),n.preventDefault();break;case"PageDown":this.decrementValue(n,t,!0),n.preventDefault();break;case"PageUp":this.incrementValue(n,t,!0),n.preventDefault();break;case"Home":this.updateModel(n,this.min),n.preventDefault();break;case"End":this.updateModel(n,this.max),n.preventDefault();break}},onBlur:function(n,t){var a,s;(a=(s=this.formField).onBlur)===null||a===void 0||a.call(s,n)},decrementValue:function(n,t){var a=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!1,s;this.range?this.step?s=this.value[t]-this.step:s=this.value[t]-1:this.step?s=this.value-this.step:!this.step&&a?s=this.value-10:s=this.value-1,this.updateModel(n,s),n.preventDefault()},incrementValue:function(n,t){var a=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!1,s;this.range?this.step?s=this.value[t]+this.step:s=this.value[t]+1:this.step?s=this.value+this.step:!this.step&&a?s=this.value+10:s=this.value+1,this.updateModel(n,s),n.preventDefault()},bindDragListeners:function(){this.dragListener||(this.dragListener=this.onDrag.bind(this),document.addEventListener("mousemove",this.dragListener)),this.dragEndListener||(this.dragEndListener=this.onDragEnd.bind(this),document.addEventListener("mouseup",this.dragEndListener))},unbindDragListeners:function(){this.dragListener&&(document.removeEventListener("mousemove",this.dragListener),this.dragListener=null),this.dragEndListener&&(document.removeEventListener("mouseup",this.dragEndListener),this.dragEndListener=null)},rangeStyle:function(){if(this.range){var n=this.rangeEndPosition>this.rangeStartPosition?this.rangeEndPosition-this.rangeStartPosition:this.rangeStartPosition-this.rangeEndPosition,t=this.rangeEndPosition>this.rangeStartPosition?this.rangeStartPosition:this.rangeEndPosition;return this.horizontal?{"inset-inline-start":t+"%",width:n+"%"}:{bottom:t+"%",height:n+"%"}}else return this.horizontal?{width:this.handlePosition+"%"}:{height:this.handlePosition+"%"}},handleStyle:function(){return this.horizontal?{"inset-inline-start":this.handlePosition+"%"}:{bottom:this.handlePosition+"%"}},rangeStartHandleStyle:function(){return this.horizontal?{"inset-inline-start":this.rangeStartPosition+"%"}:{bottom:this.rangeStartPosition+"%"}},rangeEndHandleStyle:function(){return this.horizontal?{"inset-inline-start":this.rangeEndPosition+"%"}:{bottom:this.rangeEndPosition+"%"}}},computed:{value:function(){var n;if(this.range){var t,a,s,i;return[(t=(a=this.d_value)===null||a===void 0?void 0:a[0])!==null&&t!==void 0?t:this.min,(s=(i=this.d_value)===null||i===void 0?void 0:i[1])!==null&&s!==void 0?s:this.max]}return(n=this.d_value)!==null&&n!==void 0?n:this.min},horizontal:function(){return this.orientation==="horizontal"},vertical:function(){return this.orientation==="vertical"},handlePosition:function(){return this.value<this.min?0:this.value>this.max?100:(this.value-this.min)*100/(this.max-this.min)},rangeStartPosition:function(){return this.value&&this.value[0]!==void 0?this.value[0]<this.min?0:(this.value[0]-this.min)*100/(this.max-this.min):0},rangeEndPosition:function(){return this.value&&this.value.length===2&&this.value[1]!==void 0?this.value[1]>this.max?100:(this.value[1]-this.min)*100/(this.max-this.min):100},dataP:function(){return R(te({},this.orientation,this.orientation))}}},ue=["data-p"],he=["data-p"],fe=["tabindex","aria-valuemin","aria-valuenow","aria-valuemax","aria-labelledby","aria-label","aria-orientation","data-p"],me=["tabindex","aria-valuemin","aria-valuenow","aria-valuemax","aria-labelledby","aria-label","aria-orientation","data-p"],ge=["tabindex","aria-valuemin","aria-valuenow","aria-valuemax","aria-labelledby","aria-label","aria-orientation","data-p"];function ce(e,n,t,a,s,i){return g(),m("div",p({class:e.cx("root"),onClick:n[18]||(n[18]=function(){return i.onBarClick&&i.onBarClick.apply(i,arguments)})},e.ptmi("root"),{"data-p-sliding":!1,"data-p":i.dataP}),[f("span",p({class:e.cx("range"),style:[e.sx("range"),i.rangeStyle()]},e.ptm("range"),{"data-p":i.dataP}),null,16,he),e.range?w("",!0):(g(),m("span",p({key:0,class:e.cx("handle"),style:[e.sx("handle"),i.handleStyle()],onTouchstartPassive:n[0]||(n[0]=function(r){return i.onDragStart(r)}),onTouchmovePassive:n[1]||(n[1]=function(r){return i.onDrag(r)}),onTouchend:n[2]||(n[2]=function(r){return i.onDragEnd(r)}),onMousedown:n[3]||(n[3]=function(r){return i.onMouseDown(r)}),onKeydown:n[4]||(n[4]=function(r){return i.onKeyDown(r)}),onBlur:n[5]||(n[5]=function(r){return i.onBlur(r)}),tabindex:e.tabindex,role:"slider","aria-valuemin":e.min,"aria-valuenow":e.d_value,"aria-valuemax":e.max,"aria-labelledby":e.ariaLabelledby,"aria-label":e.ariaLabel,"aria-orientation":e.orientation},e.ptm("handle"),{"data-p":i.dataP}),null,16,fe)),e.range?(g(),m("span",p({key:1,class:e.cx("handle"),style:[e.sx("handle"),i.rangeStartHandleStyle()],onTouchstartPassive:n[6]||(n[6]=function(r){return i.onDragStart(r,0)}),onTouchmovePassive:n[7]||(n[7]=function(r){return i.onDrag(r)}),onTouchend:n[8]||(n[8]=function(r){return i.onDragEnd(r)}),onMousedown:n[9]||(n[9]=function(r){return i.onMouseDown(r,0)}),onKeydown:n[10]||(n[10]=function(r){return i.onKeyDown(r,0)}),onBlur:n[11]||(n[11]=function(r){return i.onBlur(r,0)}),tabindex:e.tabindex,role:"slider","aria-valuemin":e.min,"aria-valuenow":e.d_value?e.d_value[0]:null,"aria-valuemax":e.max,"aria-labelledby":e.ariaLabelledby,"aria-label":e.ariaLabel,"aria-orientation":e.orientation},e.ptm("startHandler"),{"data-p":i.dataP}),null,16,me)):w("",!0),e.range?(g(),m("span",p({key:2,class:e.cx("handle"),style:[e.sx("handle"),i.rangeEndHandleStyle()],onTouchstartPassive:n[12]||(n[12]=function(r){return i.onDragStart(r,1)}),onTouchmovePassive:n[13]||(n[13]=function(r){return i.onDrag(r)}),onTouchend:n[14]||(n[14]=function(r){return i.onDragEnd(r)}),onMousedown:n[15]||(n[15]=function(r){return i.onMouseDown(r,1)}),onKeydown:n[16]||(n[16]=function(r){return i.onKeyDown(r,1)}),onBlur:n[17]||(n[17]=function(r){return i.onBlur(r,1)}),tabindex:e.tabindex,role:"slider","aria-valuemin":e.min,"aria-valuenow":e.d_value?e.d_value[1]:null,"aria-valuemax":e.max,"aria-labelledby":e.ariaLabelledby,"aria-label":e.ariaLabel,"aria-orientation":e.orientation},e.ptm("endHandler"),{"data-p":i.dataP}),null,16,ge)):w("",!0)],16,ue)}$.render=ce;const pe={id:"sourceSliders"},ve={class:"mb-2"},be={class:"mb-2"},ye={class:"sliderDiv flex gap-4"},we={class:"flex-grow-1 flex flex-col gap-2"},Se=["id"],De=["for"],Pe=I({__name:"AudioPanel",setup(e){const n=L("activeRunners",V),t=L("audioSources",V),a=P(),s=P([{value:0,active:!1},{value:0,active:!1},{value:0,active:!1},{value:0,active:!1}]);K(()=>t.data,o=>{var c,u;a.value=(c=n.data)==null?void 0:c.map(l=>o==null?void 0:o.find(d=>d.name===l.source)).filter(l=>l!=null),(u=a.value)==null||u.forEach((l,d)=>{const D=i(l.volume.db),B=s.value[d].value;!s.value[d].active&&B!=D&&(console.log(`Slider ${l.name} updated from OBS`),s.value[d].value=D)})});function i(o){return parseFloat((Math.pow(10,o/40)*100).toFixed(0))}function r(o){return parseFloat((40*Math.log10(o)-80).toFixed(1))}async function y(o){await nodecg.sendMessage("toggleMute",o.name)}async function M(o,c){c.active=!0,console.log(`Slider ${o.name} updated from NodeCG`),await nodecg.sendMessage("setVolume",{source:o.name,volume:r(c.value)})}async function x(o){await nodecg.sendMessage("setOffset",{source:o.name,offset:o.offset})}return(o,c)=>(g(),m("div",pe,[(g(!0),m(N,null,F(a.value,(u,l)=>(g(),m("div",{class:"sliderContainer",key:`player-${l}-slider`},[f("div",ve,[f("span",be,k(u.name),1),f("div",ye,[v(h(Y),{class:"muteButton",severity:"secondary",size:"small",onClick:d=>y(u)},{default:E(()=>[v(h(j),{type:"mdi",path:u.muted?h(O):h(X),class:U(u.muted?"text-red-500":"text-white")},null,8,["path","class"])]),_:2},1032,["onClick"]),f("div",we,[f("span",{class:"-mt-1",id:`player-${l}-volume-slider`},k(r(s.value[l].value))+" dB ",9,Se),v(h($),{"aria-labelledby":`player-${l}-volume-slider`,class:"w-full",min:0,max:100,modelValue:s.value[l].value,"onUpdate:modelValue":d=>s.value[l].value=d,onChange:d=>M(u,s.value[l]),onSlideend:d=>s.value[l].active=!1},null,8,["aria-labelledby","modelValue","onUpdate:modelValue","onChange","onSlideend"])]),v(h(G),{variant:"over",class:"w-12"},{default:E(()=>[v(h(q),{type:"number","input-id":`player-${l}-offset`,modelValue:u.offset,"onUpdate:modelValue":d=>u.offset=d,onChange:d=>x(u)},null,8,["input-id","modelValue","onUpdate:modelValue","onChange"]),f("label",{for:`player-${l}-offset`,class:"-ms-1"},"Offset",8,De)]),_:2},1024)])])]))),128))]))}});W(Pe);
