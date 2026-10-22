/* Планувальник: розміри в сантиметрах, x вздовж довжини, y вздовж ширини. Стіни: 0 верхня, 1 права, 2 нижня, 3 ліва. */
(function(){
  var svg=document.getElementById("pl-svg");if(!svg)return;
  var NS="http://www.w3.org/2000/svg",KEY="mebli-plan-v1";
  Object.assign(RU,{n9:"Планировщик",pl_e:"Планировщик",pl_h:"Спланируйте комнату и подберите мебель",
    pl_sub:"Укажите размеры комнаты: посчитаем метраж и расставим мебель, которая в неё помещается. Предметы можно перетаскивать и поворачивать, а готовый план отправить мастеру.",
    pl_room:"Тип комнаты",pl_len:"Длина, м",pl_wid:"Ширина, м",pl_hei:"Высота, м",pl_doors:"Дверей",pl_wins:"Окон",pl_dw:"Дверь на стене",
    pl_ed:"Выбранный предмет",pl_nm:"Название",pl_w:"Ширина, см",pl_d:"Глубина, см",pl_hh:"Высота, см",pl_x:"От левой стены, см",pl_y:"От верхней стены, см",pl_rot:"Повернуть",pl_del:"Убрать",pl_ok:"Готово",
    pl_v2:"2D план",pl_reset:"Сбросить вид",pl_top:"Вид сверху",
    pl_hint:"Перетаскивайте мебель мышью или пальцем. Зелёные ручки на стенах сужают и расширяют комнату, дверь перетаскивается вдоль стен. Нажмите на предмет, чтобы вписать своё название и размеры. Выделенный предмет: стрелки двигают, R поворачивает, Delete убирает.",
    pl_hint3:"Перетаскивайте мебель и дверь прямо в 3D. Дальние стены тоже можно тянуть: так комната сужается или расширяется. Перетаскивание по пустому месту вращает комнату, колесо мыши или два пальца меняют масштаб.",
    pl_fh:"Мебель в плане",pl_auto:"Подобрать заново",pl_send:"Отправить план мастеру",
    pl_note:"Размеры ориентировочные: точные снимет мастер на бесплатном замере. Цена указана только для моделей из каталога."});
  var T={
    uk:{rooms:{kitchen:"Кухня",bedroom:"Спальня",living:"Вітальня",kids:"Дитяча",hallway:"Передпокій"},
      walls:["верхня","права","нижня","ліва"],area:"Площа підлоги",per:"Периметр",wall:"Площа стін без вікон і дверей",vol:"Об’єм",occ:"Під меблями",free:"Вільна площа",
      m:"м",m2:"м²",m3:"м³",cm:"см",hgt:"висота",add:"+ Додати предмет",rot:"Повернути",del:"Прибрати",from:"від",calc:"за розрахунком",
      empty:"У плані поки немає меблів. Додайте предмет або натисніть «Підібрати заново».",skip:"Не вмістилося: ",
      bad:"Червоним позначено предмети, що перетинаються або закривають двері.",tight:"Меблі займають понад 45% підлоги, проходи можуть бути тісними.",
      wallTip:"Потягніть, щоб звузити або розширити кімнату",doorTip:"Потягніть, щоб перемістити двері",
      load3:"Завантажуємо 3D…",fail3:"3D не підтримується цим браузером, показуємо 2D план.",
      rside:"Права сторона, см",next:"В інший кут",rotT:"Повернути",lside:"Ліва сторона, см",wid:"Ширина, см",cornerG:"Кутові меблі",
      plan:"План кімнати",own:"✎ Свій предмет: назва й розмір",att:"До заявки додано план: ",items:"предметів",rmAtt:"Прибрати план із заявки",furn:"Меблі"},
    ru:{rooms:{kitchen:"Кухня",bedroom:"Спальня",living:"Гостиная",kids:"Детская",hallway:"Прихожая"},
      walls:["верхней","правой","нижней","левой"],area:"Площадь пола",per:"Периметр",wall:"Площадь стен без окон и дверей",vol:"Объём",occ:"Под мебелью",free:"Свободная площадь",
      m:"м",m2:"м²",m3:"м³",cm:"см",hgt:"высота",add:"+ Добавить предмет",rot:"Повернуть",del:"Убрать",from:"от",calc:"по расчёту",
      empty:"В плане пока нет мебели. Добавьте предмет или нажмите «Подобрать заново».",skip:"Не поместилось: ",
      bad:"Красным отмечены предметы, которые пересекаются или закрывают дверь.",tight:"Мебель занимает больше 45% пола, проходы могут быть тесными.",
      wallTip:"Потяните, чтобы сузить или расширить комнату",doorTip:"Потяните, чтобы переместить дверь",
      load3:"Загружаем 3D…",fail3:"3D не поддерживается этим браузером, показываем 2D план.",
      rside:"Правая сторона, см",next:"В другой угол",rotT:"Повернуть",lside:"Левая сторона, см",wid:"Ширина, см",cornerG:"Угловая мебель",
      plan:"План комнаты",own:"✎ Свой предмет: название и размер",att:"К заявке добавлен план: ",items:"предметов",rmAtt:"Убрать план из заявки",furn:"Мебель"}};
  T.uk.walls=["верхній","правій","нижній","лівій"];
  /* w: ширина вздовж стіни, d: глибина, c: місце перед предметом, dyn: межі ширини для підбору, p: ціна «від» з каталогу (pw: для якої ширини) */
  var LIB={
    kset:{uk:"Кухонний гарнітур",ru:"Кухонный гарнитур",s:["Кухня","Кухня"],w:240,d:60,h:90,c:90,dyn:[120,360]},
    fridge:{uk:"Холодильник",ru:"Холодильник",s:["Холод.","Холод."],w:60,d:65,h:185,c:90,tall:1},
    dt120:{uk:"Обідній стіл 120×80",ru:"Обеденный стол 120×80",s:["Стіл","Стол"],w:120,d:80,h:75},
    dt160:{uk:"Обідній стіл 160×90",ru:"Обеденный стол 160×90",s:["Стіл","Стол"],w:160,d:90,h:75,p:11200},
    chair:{uk:"Стілець",ru:"Стул",s:["","" ],w:45,d:50,h:90},
    bed160:{uk:"Ліжко 160×200",ru:"Кровать 160×200",s:["Ліжко","Кровать"],w:170,d:210,h:100,c:60,p:14500},
    bed140:{uk:"Ліжко 140×200",ru:"Кровать 140×200",s:["Ліжко","Кровать"],w:150,d:210,h:100,c:60},
    bed90:{uk:"Ліжко 90×200",ru:"Кровать 90×200",s:["Ліжко","Кровать"],w:100,d:205,h:90,c:50},
    night:{uk:"Приліжкова тумба",ru:"Прикроватная тумба",s:["Тумба","Тумба"],w:45,d:40,h:50},
    ward:{uk:"Шафа-купе",ru:"Шкаф-купе",s:["Шафа","Шкаф"],w:240,d:60,h:220,c:70,dyn:[100,300],p:19800,pw:240,tall:1},
    dresser:{uk:"Комод",ru:"Комод",w:90,d:42,h:85,c:60,p:8900},
    sofa:{uk:"Диван",ru:"Диван",w:220,d:95,h:85},
    arm:{uk:"Крісло",ru:"Кресло",w:85,d:85,h:85},
    ctable:{uk:"Журнальний стіл",ru:"Журнальный стол",s:["Столик","Столик"],w:100,d:60,h:45},
    tv:{uk:"ТВ-тумба",ru:"ТВ-тумба",w:180,d:45,h:50,c:40},
    shelf:{uk:"Стелаж",ru:"Стеллаж",w:80,d:40,h:180,c:50,tall:1},
    desk:{uk:"Письмовий стіл",ru:"Письменный стол",s:["Стіл","Стол"],w:120,d:60,h:75,c:70},
    hward:{uk:"Шафа в передпокій",ru:"Шкаф в прихожую",s:["Шафа","Шкаф"],w:150,d:45,h:220,c:70,dyn:[80,240],tall:1},
    shoe:{uk:"Тумба для взуття",ru:"Тумба для обуви",s:["Взуття","Обувь"],w:80,d:35,h:60,c:50},
    bench:{uk:"Банкетка",ru:"Банкетка",w:90,d:40,h:45,c:50},
    custom:{uk:"Свій предмет",ru:"Свой предмет",s:["Предмет","Предмет"],w:100,d:50,h:75},
    cdesk:{uk:"Кутовий комп’ютерний стіл",ru:"Угловой компьютерный стол",s:["Стіл","Стол"],w:150,w2:120,d:60,h:75,corner:1},
    csofa:{uk:"Кутовий диван",ru:"Угловой диван",s:["Диван","Диван"],w:260,w2:180,d:95,h:85,corner:1},
    ckit:{uk:"Кутова кухня",ru:"Угловая кухня",s:["Кухня","Кухня"],w:240,w2:180,d:60,h:90,corner:1},
    cward:{uk:"Кутова шафа",ru:"Угловой шкаф",s:["Шафа","Шкаф"],w:150,w2:120,d:60,h:220,corner:1,tall:1},
    hanger:{uk:"Відкрита вішалка",ru:"Открытая вешалка",s:["Вішалка","Вешалка"],w:80,d:30,h:180,c:50}
  };
  var DW=90;/* ширина дверного прорізу з коробкою, см */
  var SETS={bedroom:["bed160","bed140","bed90","night","ward","dresser"],living:["sofa","arm","ctable","tv","shelf","dresser"],
    kitchen:["kset","fridge","dt120","dt160","chair"],kids:["bed90","desk","ward","shelf","dresser"],hallway:["hward","shoe","bench","hanger"]};
  var ROOMS=["bedroom","living","kitchen","kids","hallway"],CORNER=["cdesk","csofa","ckit","cward"];

  var st={room:"bedroom",L:400,W:350,H:270,dn:1,wn:1,dw:2,dp:20,items:[],edited:false},sel=null,skipped=[],uid=1,drag=null,nodes={},attached=false;
  var V3=null,view="3d",vbFrozen=null,rd=null;
  var $=function(id){return document.getElementById(id)};
  var inp={L:$("pl-L"),W:$("pl-W"),H:$("pl-H"),dn:$("pl-dn"),wn:$("pl-wn")},dwSel=$("pl-dw"),addSel=$("pl-add");

  function lg(){return document.documentElement.lang==="ru"?"ru":"uk"}
  function tr(k){return T[lg()][k]}
  function nm(it){return it.n||LIB[it.k][lg()]}
  function shortNm(it){var b=LIB[it.k];if(it.n)return it.n;return b.s?b.s[lg()==="ru"?1:0]:b[lg()]}
  function price(it){var b=LIB[it.k];return b.p&&it.d===b.d&&it.w===(b.pw||b.w)?b.p:0}
  function money(n){return String(n).replace(/\B(?=(\d{3})+$)/g," ")+" ₴"}
  function fmt(n,d){return n.toFixed(d===undefined?2:d).replace(".",",")}
  function snap(v){return Math.round(v/5)*5}

  /* Геометрія */
  /* Кутовий предмет (corner): w — права сторона, w2 — ліва, d — глибина обох сторін.
     При o=0 стоїть у верхньому лівому куті: права сторона вздовж верхньої стіни, ліва вздовж лівої;
     кожен поворот переносить його в наступний кут за годинниковою стрілкою. */
  function isC(it){return!!LIB[it.k].corner}
  function cd(it){return Math.min(it.d,it.w-10,it.w2-10)}
  function fp(it){var bw=it.w,bh=isC(it)?it.w2:it.d;return it.o%2?{x:it.x,y:it.y,w:bh,h:bw}:{x:it.x,y:it.y,w:bw,h:bh}}
  function parts(it){
    var f=fp(it);if(!isC(it))return[f];
    var bw=it.w,bh=it.w2,d=cd(it),t,rs=[{x:0,y:0,w:bw,h:d},{x:0,y:d,w:d,h:bh-d}];
    for(var i=0;i<it.o;i++){rs=rs.map(function(r){return{x:bh-(r.y+r.h),y:r.x,w:r.h,h:r.w}});t=bw;bw=bh;bh=t}
    return rs.map(function(r){return{x:f.x+r.x,y:f.y+r.y,w:r.w,h:r.h}});
  }
  function ovR(it,r){return parts(it).some(function(p){return ov(p,r)})}
  function ovIt(a,b){var pb=parts(b);return parts(a).some(function(p){return pb.some(function(q){return ov(p,q)})})}
  function area(it){return parts(it).reduce(function(s,r){return s+r.w*r.h},0)}
  function dims(it){return(isC(it)?it.w+" + "+it.w2:it.w)+" × "+it.d+" × "+hOf(it)}
  function ov(a,b){return a.x<b.x+b.w-.5&&b.x<a.x+a.w-.5&&a.y<b.y+b.h-.5&&b.y<a.y+a.h-.5}
  function inRoom(r){return r.x>-.5&&r.y>-.5&&r.x+r.w<st.L+.5&&r.y+r.h<st.W+.5}
  function wlen(w){return w%2?st.W:st.L}
  /* прямокутник у системі стіни: u вздовж стіни, v вглиб кімнати */
  function wrect(w,u,v,du,dv){
    if(w===0)return{x:u,y:v,w:du,h:dv};
    if(w===2)return{x:u,y:st.W-v-dv,w:du,h:dv};
    if(w===3)return{x:v,y:u,w:dv,h:du};
    return{x:st.L-v-dv,y:u,w:dv,h:du};
  }
  function doorZone(){return st.dn>0?wrect(st.dw,st.dp,0,DW,90):null}
  function fixDoor(){st.dp=Math.max(0,Math.min(st.dp,wlen(st.dw)-DW))}
  function hOf(it){return it.h||LIB[it.k].h}
  function winZone(){var w=(st.dw+2)%4;return st.wn>0?wrect(w,wlen(w)/2-70,0,140,30):null}
  function clr(it){
    var c=LIB[it.k].c;if(!c)return null;var f=fp(it);
    return[{x:f.x,y:f.y+f.h,w:f.w,h:c},{x:f.x-c,y:f.y,w:c,h:f.h},{x:f.x,y:f.y-c,w:f.w,h:c},{x:f.x+f.w,y:f.y,w:c,h:f.h}][it.o];
  }
  function canPlace(it,placed){
    var f=fp(it),c=clr(it),dz=doorZone(),wz=winZone();
    if(!inRoom(f)||(dz&&ovR(it,dz))||(c&&!inRoom(c))||(LIB[it.k].tall&&wz&&ovR(it,wz)))return false;
    for(var i=0;i<placed.length;i++){
      var p=placed[i],pc=clr(p);
      if(ovIt(it,p)||(c&&ovR(p,c))||(pc&&ovR(it,pc)))return false;
    }
    return true;
  }
  function atWall(k,w,s,ww){
    var d=LIB[k].d,it={k:k,w:ww,d:d,o:w};
    if(w===0){it.x=s;it.y=0}else if(w===2){it.x=s;it.y=st.W-d}else if(w===1){it.x=st.L-d;it.y=s}else{it.x=0;it.y=s}
    return it;
  }
  function placeWall(k,walls,pref,placed,maxW){
    var b=LIB[k],widths=[b.w];
    if(b.dyn){widths=[];for(var x=Math.min(maxW||b.w,b.dyn[1]);x>=b.dyn[0];x-=10)widths.push(x)}
    for(var i=0;i<widths.length;i++)for(var j=0;j<walls.length;j++){
      var ww=widths[i],len=wlen(walls[j]),cand=[];if(ww>len)continue;
      for(var s=0;s<=len-ww;s+=5)cand.push(s);cand.push(len-ww);
      cand.sort(function(a,c){return pref==="corner"?Math.min(a,len-ww-a)-Math.min(c,len-ww-c):Math.abs(a+ww/2-len/2)-Math.abs(c+ww/2-len/2)});
      for(var n=0;n<cand.length;n++){var it=atWall(k,walls[j],cand[n],ww);if(canPlace(it,placed)){placed.push(it);return it}}
    }
    return null;
  }
  /* поруч з base на тій самій стіні */
  function attach(k,base,placed,both){
    var w=LIB[k].w,a=base.o%2?base.y:base.x,res=[];
    [a-w,a+base.w].forEach(function(s){
      if(res.length&&!both)return;
      var it=atWall(k,base.o,s,w);if(canPlace(it,placed)){placed.push(it);res.push(it)}
    });
    return res;
  }
  /* перед base, на відстані gap */
  function inFront(k,base,gap,placed){
    var b=LIB[k],f=fp(base),it={k:k,w:b.w,d:b.d,o:base.o};
    if(base.o===0){it.x=f.x+(f.w-b.w)/2;it.y=f.y+f.h+gap}
    else if(base.o===2){it.x=f.x+(f.w-b.w)/2;it.y=f.y-gap-b.d}
    else if(base.o===1){it.x=f.x-gap-b.d;it.y=f.y+(f.h-b.w)/2}
    else{it.x=f.x+f.w+gap;it.y=f.y+(f.h-b.w)/2}
    it.x=snap(it.x);it.y=snap(it.y);
    if(canPlace(it,placed)){placed.push(it);return it}
    return null;
  }
  /* вільне місце з відступом m від стін і меблів, ближче до центру */
  function placeFree(k,m,placed){
    var b=LIB[k],o=st.W>st.L?1:0,best=null,bd=1e9,dz=doorZone();
    for(var x=0;x<=st.L;x+=10)for(var y=0;y<=st.W;y+=10){
      var it={k:k,w:b.w,d:b.d,o:o,x:x,y:y},f=fp(it),r={x:f.x-m,y:f.y-m,w:f.w+2*m,h:f.h+2*m};
      if(!inRoom(r)||(dz&&ov(r,dz))||!canPlace(it,placed))continue;
      if(placed.some(function(p){return ovR(p,r)}))continue;
      var dd=Math.pow(f.x+f.w/2-st.L/2,2)+Math.pow(f.y+f.h/2-st.W/2,2);
      if(dd<bd){bd=dd;best=it}
    }
    if(best)placed.push(best);
    return best;
  }
  function chairs(t,placed){
    var f=fp(t),n=t.w>=150?2:1,i,c;
    for(i=0;i<n;i++){
      if(t.o%2===0){
        var cx=f.x+f.w*(i+.5)/n-22.5;
        c=[{k:"chair",w:45,d:50,o:0,x:cx,y:f.y-50},{k:"chair",w:45,d:50,o:2,x:cx,y:f.y+f.h}];
      }else{
        var cy=f.y+f.h*(i+.5)/n-22.5;
        c=[{k:"chair",w:45,d:50,o:3,x:f.x-50,y:cy},{k:"chair",w:45,d:50,o:1,x:f.x+f.w,y:cy}];
      }
      c.forEach(function(ch){if(canPlace(ch,placed))placed.push(ch)});
    }
  }

  /* Автоматичний підбір */
  function pick(){
    var P=[],sk=[],dw=st.dw,opp=(dw+2)%4,s1=(dw+1)%4,s2=(dw+3)%4,all=[opp,s1,s2,dw],A=st.L*st.W/1e4,x;
    function need(r,k){if(!r)sk.push(k);return r}
    if(st.room==="bedroom"){
      var bk=A>=10.5?["bed160","bed140","bed90"]:A>=8?["bed140","bed90"]:["bed90"],bed=null;
      for(var i=0;i<bk.length&&!bed;i++)bed=placeWall(bk[i],[opp,s1,s2],"center",P);
      if(need(bed,bk[0]))attach("night",bed,P,true);
      need(placeWall("ward",[s1,s2,dw,opp],"corner",P),"ward");
      if(A>=9)need(placeWall("dresser",all,"center",P),"dresser");
    }else if(st.room==="kids"){
      need(placeWall("bed90",[s1,s2,opp],"corner",P),"bed90");
      need(placeWall("desk",[opp,s1,s2],"center",P),"desk");
      need(placeWall("ward",[s2,s1,dw,opp],"corner",P,160),"ward");
      if(A>=9)need(placeWall("shelf",all,"corner",P),"shelf");
    }else if(st.room==="living"){
      var sofa=need(placeWall("sofa",[s1,s2,opp],"center",P),"sofa");
      if(sofa){need(placeWall("tv",[(sofa.o+2)%4].concat(all),"center",P),"tv");need(inFront("ctable",sofa,40,P),"ctable")}
      if(A>=16)placeWall("arm",all,"corner",P);
      need(placeWall("shelf",all,"corner",P),"shelf");
    }else if(st.room==="kitchen"){
      var ks=null;
      [opp,s1,s2].forEach(function(w){if(!ks)ks=placeWall("kset",[w],"corner",P,Math.min(360,Math.floor((wlen(w)-65)/10)*10))});
      if(need(ks,"kset")&&!attach("fridge",ks,P).length)need(placeWall("fridge",all,"corner",P),"fridge");
      var tk=A>=12?"dt160":"dt120",t=placeFree(tk,60,P)||(tk==="dt160"?placeFree("dt120",60,P):null);
      if(need(t,"dt120"))chairs(t,P);
    }else{
      need(placeWall("hward",[s1,s2,opp],"corner",P,200),"hward");
      need(placeWall("shoe",all,"center",P),"shoe");
      if(A>=4)placeWall("bench",all,"center",P);
      if(A>=3.5)placeWall("hanger",all,"corner",P);
    }
    P.forEach(function(it){it.id=uid++});
    st.items=P;skipped=sk;sel=null;st.edited=false;
  }

  /* Малювання */
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
  function wallMatrix(w){return["matrix(1 0 0 1 0 0)","matrix(0 1 -1 0 "+st.L+" 0)","matrix(1 0 0 -1 0 "+st.W+")","matrix(0 1 1 0 0 0)"][w]}
  function fsBase(){return Math.max(st.L,st.W)/26}
  function draw(){
    svg.textContent="";nodes={};
    var L=st.L,W=st.W,pad=Math.max(L,W)*.07+24,fs=fsBase(),x,y;
    svg.setAttribute("viewBox",(vbFrozen||[-pad,-pad,L+2*pad,W+2*pad]).join(" "));
    svg.setAttribute("aria-label",tr("plan")+": "+fmt(L/100)+" × "+fmt(W/100)+" "+tr("m"));
    var fl=el("rect",{x:0,y:0,width:L,height:W,"class":"pl-fl"},svg);
    fl.addEventListener("pointerdown",function(){if(sel!==null){sel=null;update()}});
    for(x=50;x<L;x+=50)el("line",{x1:x,y1:0,x2:x,y2:W,"class":"pl-grid"+(x%100?"":" m")},svg);
    for(y=50;y<W;y+=50)el("line",{x1:0,y1:y,x2:L,y2:y,"class":"pl-grid"+(y%100?"":" m")},svg);
    el("rect",{x:-4,y:-4,width:L+8,height:W+8,"class":"pl-wall"},svg);
    /* ручки стін: тягнути, щоб звузити або розширити кімнату */
    var grips=[];
    [0,1,2,3].forEach(function(w){
      var len=wlen(w),g=el("g",{transform:wallMatrix(w),"class":"pl-wh "+(w%2?"v":"h")},svg),gl=Math.min(len*.3,fs*3);
      el("rect",{x:20,y:-26,width:Math.max(0,len-40),height:38,"class":"pl-hit"},g);
      grips.push([w,{x:len/2-gl/2,y:-4-fs*.22,width:gl,height:fs*.44,rx:fs*.22,"class":"pl-grip"}]);
      el("title",{},g).textContent=tr("wallTip");
      g.addEventListener("pointerdown",function(e){startRoomDrag(e,"wall",w)});
    });
    if(st.dn>0){
      var dp=st.dp,dg=el("g",{transform:wallMatrix(st.dw),"class":"pl-dh"},svg);
      el("rect",{x:dp,y:-9,width:DW,height:10,"class":"pl-gap"},dg);
      el("path",{d:"M"+(dp+5)+" 0V80M"+(dp+85)+" 0A80 80 0 0 1 "+(dp+5)+" 80","class":"pl-door"},dg);
      el("rect",{x:dp,y:-26,width:DW,height:110,"class":"pl-hit"},dg);
      el("title",{},dg).textContent=tr("doorTip");
      dg.addEventListener("pointerdown",function(e){startRoomDrag(e,"door")});
    }
    if(st.wn>0){
      var ow=(st.dw+2)%4,u=wlen(ow)/2,wg=el("g",{transform:wallMatrix(ow),"pointer-events":"none"},svg);
      el("rect",{x:u-70,y:-9,width:140,height:10,"class":"pl-win"},wg);
    }
    grips.forEach(function(a){el("rect",a[1],el("g",{transform:wallMatrix(a[0]),"pointer-events":"none"},svg))});
    el("text",{x:L/2,y:-pad*.5,"class":"pl-dim","font-size":fs*.85},svg).textContent=fmt(L/100)+" "+tr("m");
    el("text",{x:-pad*.5,y:W/2,"class":"pl-dim","font-size":fs*.85,transform:"rotate(-90 "+(-pad*.5)+" "+W/2+")"},svg).textContent=fmt(W/100)+" "+tr("m");
    var gi=el("g",{},svg);
    st.items.forEach(function(it){nodes[it.id]=build(it,gi)});
    update();
  }
  function build(it,parent){
    var g=el("g",{"class":"it",tabindex:0,role:"button"},parent),b=el("g",{},g),w=it.w,d=it.d,k=it.k,i;
    var ttl=el("title",{},g);
    if(isC(it)){
      var w2=it.w2,cdp=cd(it),x0=-w/2,y0=-w2/2;
      el("path",{"class":"b",d:"M"+x0+" "+y0+"H"+(w/2)+"V"+(y0+cdp)+"H"+(x0+cdp)+"V"+(w2/2)+"H"+x0+"Z"},b);
      if(k==="csofa")el("path",{"class":"dt",d:"M"+(w/2)+" "+(y0+22)+"H"+(x0+22)+"V"+(w2/2)},b);
      else if(k==="cward")el("path",{"class":"dt",d:"M"+(w/2)+" "+(y0+cdp/2)+"H"+(x0+cdp/2)+"V"+(w2/2)},b);
      else if(k==="ckit")el("path",{"class":"dt",d:"M"+(w/2)+" "+(y0+cdp-6)+"H"+(x0+cdp-6)+"V"+(w2/2)},b);
    }else el("rect",{"class":"b",x:-w/2,y:-d/2,width:w,height:d,rx:3},b);
    if(k.indexOf("bed")===0){
      var n=w>=140?2:1,pw=(w-20-(n-1)*10)/n;
      for(i=0;i<n;i++)el("rect",{"class":"dt",x:-w/2+10+i*(pw+10),y:-d/2+8,width:pw,height:30,rx:4},b);
      el("line",{"class":"dt",x1:-w/2,y1:-d/2+55,x2:w/2,y2:-d/2+55},b);
    }else if(k==="sofa"||k==="arm"){
      el("rect",{"class":"dt",x:-w/2,y:-d/2,width:w,height:22},b);
      el("line",{"class":"dt",x1:-w/2+18,y1:-d/2+22,x2:-w/2+18,y2:d/2},b);
      el("line",{"class":"dt",x1:w/2-18,y1:-d/2+22,x2:w/2-18,y2:d/2},b);
    }else if(k==="ward"||k==="hward"||k==="shelf"){
      el("line",{"class":"dt",x1:-w/2,y1:0,x2:w/2,y2:0},b);
    }else if(k==="kset"){
      el("line",{"class":"dt",x1:-w/2,y1:d/2-6,x2:w/2,y2:d/2-6},b);
      if(w>=180)el("rect",{"class":"dt",x:-25,y:-d/2+10,width:50,height:36,rx:6},b);
    }else if(k==="chair"){
      el("rect",{"class":"dt",x:-w/2,y:-d/2,width:w,height:8},b);
    }
    var tx=el("text",{},g);
    g.addEventListener("pointerdown",function(e){
      if(e.button>0)return;e.preventDefault();
      var p=pt(e),f=fp(it);drag={id:it.id,dx:p.x-f.x,dy:p.y-f.y,moved:false};
      sel=it.id;g.parentNode.appendChild(g);g.focus({preventScroll:true});update();
      try{g.setPointerCapture(e.pointerId)}catch(_){}
    });
    g.addEventListener("pointermove",function(e){
      if(!drag||drag.id!==it.id)return;
      var p=pt(e),nx=snap(p.x-drag.dx),ny=snap(p.y-drag.dy);
      if(nx===it.x&&ny===it.y)return;
      it.x=nx;it.y=ny;clamp(it);drag.moved=true;update();
    });
    function end(){if(drag&&drag.id===it.id){if(drag.moved){st.edited=true;save()}drag=null}}
    g.addEventListener("pointerup",end);g.addEventListener("pointercancel",end);
    g.addEventListener("keydown",function(e){
      var s=e.shiftKey?25:5,mv={ArrowLeft:[-s,0],ArrowRight:[s,0],ArrowUp:[0,-s],ArrowDown:[0,s]}[e.key];
      if(mv){e.preventDefault();it.x+=mv[0];it.y+=mv[1];clamp(it);sel=it.id;st.edited=true;update();save()}
      else if(/^[rRкК]$/.test(e.key)){e.preventDefault();rotate(it);refocus(it)}
      else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();remove(it)}
      else if(e.key==="Escape"){sel=null;update()}
    });
    g.addEventListener("focus",function(){if(sel!==it.id){sel=it.id;update()}});
    return{g:g,b:b,tx:tx,ttl:ttl};
  }
  function pt(e){var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
  function clamp(it){var f=fp(it);it.x=Math.max(0,Math.min(it.x,st.L-f.w));it.y=Math.max(0,Math.min(it.y,st.W-f.h))}

  /* Зміна кімнати: p — точка в сантиметрах у координатах кімнати.
     Коли рухається ліва або верхня стіна, початок координат зсувається на [dx,dy], щоб меблі лишалися на місці. */
  function lim(v){return Math.max(150,Math.min(1200,v))}
  function resizeWall(w,p){
    var dx=0,dy=0,v;
    if(w===1)st.L=lim(snap(p.x));
    else if(w===2)st.W=lim(snap(p.y));
    else if(w===3){v=lim(st.L-snap(p.x));dx=st.L-v;st.L=v}
    else{v=lim(st.W-snap(p.y));dy=st.W-v;st.W=v}
    if(dx||dy){
      st.items.forEach(function(it){it.x-=dx;it.y-=dy});
      st.dp-=st.dw%2?dy:dx;
      if(V3)V3.shift(dx,dy);
    }
    st.items.forEach(clamp);fixDoor();syncInputs();
    return[dx,dy];
  }
  function moveDoor(p){
    var d=[Math.abs(p.y),Math.abs(st.L-p.x),Math.abs(st.W-p.y),Math.abs(p.x)],w=d.indexOf(Math.min.apply(null,d));
    st.dw=w;st.dp=snap((w%2?p.y:p.x)-DW/2);fixDoor();dwSel.value=w;
  }
  function syncInputs(){
    [["L",st.L/100],["W",st.W/100],["H",st.H/100]].forEach(function(a){
      if(document.activeElement!==inp[a[0]]){inp[a[0]].value=a[1];inp[a[0]].setAttribute("aria-invalid",false)}
    });
  }
  function afterRoomChange(){if(!st.edited)pick();draw();save()}
  function startRoomDrag(e,mode,w){
    if(e.button>0)return;e.preventDefault();e.stopPropagation();
    rd={mode:mode,w:w,moved:false};vbFrozen=svg.getAttribute("viewBox").split(" ").map(Number);
    try{svg.setPointerCapture(e.pointerId)}catch(_){}
  }
  svg.addEventListener("pointermove",function(e){
    if(!rd)return;var p=pt(e);
    if(rd.mode==="wall"){var s=resizeWall(rd.w,p);vbFrozen[0]-=s[0];vbFrozen[1]-=s[1]}
    else moveDoor(p);
    rd.moved=true;draw();
  });
  function endRoomDrag(){if(!rd)return;var m=rd.moved;rd=null;vbFrozen=null;if(m)afterRoomChange();else draw()}
  svg.addEventListener("pointerup",endRoomDrag);svg.addEventListener("pointercancel",endRoomDrag);
  function rotate(it){
    var f=fp(it),cx=f.x+f.w/2,cy=f.y+f.h/2;it.o=(it.o+1)%4;
    var n=fp(it);it.x=snap(cx-n.w/2);it.y=snap(cy-n.h/2);
    /* кутовий предмет переходить у наступний кут кімнати */
    if(isC(it)){it.x=it.o===1||it.o===2?st.L-n.w:0;it.y=it.o>=2?st.W-n.h:0}
    clamp(it);sel=it.id;st.edited=true;update();save();
  }
  function remove(it){st.items=st.items.filter(function(x){return x!==it});sel=null;st.edited=true;draw();save()}
  function refocus(it){var n=nodes[it.id];if(n)n.g.focus({preventScroll:true})}
  function badSet(){
    var bad={},dz=doorZone(),its=st.items;
    its.forEach(function(a,i){
      if(!inRoom(fp(a))||(dz&&ovR(a,dz)))bad[a.id]=1;
      for(var j=i+1;j<its.length;j++)if(ovIt(a,its[j])){bad[a.id]=1;bad[its[j].id]=1}
    });
    return bad;
  }
  function update(){
    var bad=badSet(),fs=fsBase();
    st.items.forEach(function(it){
      var n=nodes[it.id];if(!n)return;
      var f=fp(it),cx=f.x+f.w/2,cy=f.y+f.h/2,lab=shortNm(it);
      n.b.setAttribute("transform","translate("+cx+" "+cy+") rotate("+it.o*90+")");
      /* у кутового предмета підпис стоїть на довшій стороні, а не в порожньому куті */
      var lr=f;if(isC(it)){var ps=parts(it);lr=ps[0].w*ps[0].h>=ps[1].w*ps[1].h?ps[0]:ps[1]}
      var size=Math.min(fs*.8,(lr.w-8)/Math.max(1,lab.length*.62),lr.h*.42);
      n.tx.setAttribute("x",lr.x+lr.w/2);n.tx.setAttribute("y",lr.y+lr.h/2);n.tx.setAttribute("font-size",size);
      n.tx.textContent=lab;n.tx.style.display=!lab||size<fs*.4?"none":"";
      var full=nm(it)+", "+dims(it)+" "+tr("cm");
      n.ttl.textContent=full;n.g.setAttribute("aria-label",full);
      n.g.classList.toggle("sel",sel===it.id);n.g.classList.toggle("bad",!!bad[it.id]);
    });
    side(bad);syncEd();
    if(V3&&view==="3d")V3.sync(bad);
  }
  /* Редактор вибраного предмета */
  var ed=$("pl-ed"),pe={n:$("pe-n"),w:$("pe-w"),w2:$("pe-w2"),d:$("pe-d"),h:$("pe-h"),x:$("pe-x"),y:$("pe-y")};
  function cur(){return st.items.filter(function(i){return i.id===sel})[0]}
  function syncEd(force){
    var it=cur();ed.hidden=!it;if(!it)return;
    var v={n:it.n||"",w:it.w,w2:it.w2||"",d:it.d,h:hOf(it),x:Math.round(it.x),y:Math.round(it.y)};
    $("pe-wl").textContent=tr(isC(it)?"rside":"wid");$("pe-w2l").textContent=tr("lside");pe.w2.parentNode.hidden=!isC(it);$("pe-rot").textContent=tr(isC(it)?"next":"rotT");
    Object.keys(pe).forEach(function(k){if(force||document.activeElement!==pe[k])pe[k].value=v[k]});
    pe.n.placeholder=LIB[it.k][lg()];
  }
  pe.n.addEventListener("input",function(){var it=cur();if(!it)return;it.n=pe.n.value.trim().slice(0,40)||undefined;st.edited=true;update();save()});
  ["w","w2","d"].forEach(function(k){
    pe[k].addEventListener("input",function(){
      var it=cur(),v=Math.round(parseFloat(pe[k].value));if(!it||!(v>=20&&v<=(k==="d"?400:600))||(k==="w2"&&!isC(it)))return;
      it[k]=v;clamp(it);st.edited=true;draw();save();
    });
  });
  pe.h.addEventListener("input",function(){
    var it=cur(),v=Math.round(parseFloat(pe.h.value));if(!it||!(v>=5&&v<=300))return;
    it.h=v;st.edited=true;update();save();
  });
  ["x","y"].forEach(function(k){
    pe[k].addEventListener("input",function(){
      var it=cur(),v=Math.round(parseFloat(pe[k].value));if(!it||!(v>=0))return;
      it[k]=v;clamp(it);st.edited=true;update();save();
    });
  });
  Object.keys(pe).forEach(function(k){pe[k].addEventListener("change",function(){syncEd(true)})});
  $("pe-rot").addEventListener("click",function(){var it=cur();if(it)rotate(it)});
  $("pe-del").addEventListener("click",function(){var it=cur();if(it)remove(it)});
  $("pe-ok").addEventListener("click",function(){sel=null;update()});

  /* Бічна частина: показники, список, попередження */
  function side(bad){
    var A=st.L*st.W/1e4,P=2*(st.L+st.W)/100,H=st.H/100,Wl=Math.max(0,P*H-st.dn*1.6-st.wn*2.1),occ=0;
    st.items.forEach(function(it){occ+=area(it)/1e4});
    var pct=A?Math.round(occ/A*100):0,rows=[[tr("area"),fmt(A)+" "+tr("m2")],[tr("per"),fmt(P)+" "+tr("m")],[tr("wall"),fmt(Wl,1)+" "+tr("m2")],
      [tr("vol"),fmt(A*H,1)+" "+tr("m3")],[tr("occ"),fmt(occ)+" "+tr("m2")+"<small>"+pct+"%</small>"],[tr("free"),fmt(Math.max(0,A-occ))+" "+tr("m2")]];
    $("pl-stats").innerHTML=rows.map(function(r){return"<div><dt>"+r[0]+"</dt><dd>"+r[1]+"</dd></div>"}).join("");
    var ul=$("pl-list");ul.textContent="";
    if(!st.items.length){var e=document.createElement("li");e.className="empty";e.textContent=tr("empty");ul.appendChild(e)}
    st.items.forEach(function(it){
      var li=document.createElement("li");li.className=(sel===it.id?"sel ":"")+(bad[it.id]?"bad":"");
      var b=document.createElement("button");b.type="button";b.className="nm";b.textContent=nm(it);
      var sm=document.createElement("small");sm.textContent=dims(it)+" "+tr("cm");b.appendChild(sm);
      b.onclick=function(){sel=it.id;update();ed.scrollIntoView({block:"nearest"})};
      var pr=document.createElement("span"),p=price(it);pr.className="pr"+(p?"":" q");pr.textContent=p?tr("from")+" "+money(p):tr("calc");
      var r=document.createElement("button");r.type="button";r.className="ib";r.textContent="⟳";r.title=tr("rot")+": "+nm(it);r.setAttribute("aria-label",r.title);r.onclick=function(){rotate(it)};
      var d=document.createElement("button");d.type="button";d.className="ib";d.textContent="×";d.title=tr("del")+": "+nm(it);d.setAttribute("aria-label",d.title);d.onclick=function(){remove(it)};
      li.append(b,pr,r,d);ul.appendChild(li);
    });
    var msg=[];
    if(skipped.length)msg.push(tr("skip")+skipped.map(function(k){return LIB[k][lg()]}).join(", ")+".");
    if(Object.keys(bad).length)msg.push(tr("bad"));
    if(pct>45)msg.push(tr("tight"));
    var w=$("pl-warn");w.hidden=!msg.length;w.textContent=msg.join(" ");
  }
  function texts(){
    var box=$("pl-rooms");box.textContent="";box.setAttribute("aria-label",tr("plan"));
    ROOMS.forEach(function(r){
      var b=document.createElement("button");b.type="button";b.className="pill"+(st.room===r?" on":"");
      b.setAttribute("aria-pressed",st.room===r);b.textContent=tr("rooms")[r];
      b.onclick=function(){st.room=r;pick();texts();draw();save()};box.appendChild(b);
    });
    dwSel.innerHTML=tr("walls").map(function(w,i){return"<option value='"+i+"'>"+w+"</option>"}).join("");dwSel.value=st.dw;
    var h="<option value=''>"+tr("add")+"</option><option value='custom'>"+tr("own")+"</option>",order=[st.room].concat(ROOMS.filter(function(r){return r!==st.room}));
    h+="<optgroup label='"+tr("cornerG")+"'>"+CORNER.map(function(k){return"<option value='"+k+"'>"+LIB[k][lg()]+"</option>"}).join("")+"</optgroup>";
    order.forEach(function(r){h+="<optgroup label='"+tr("rooms")[r]+"'>"+SETS[r].map(function(k){return"<option value='"+k+"'>"+LIB[k][lg()]+"</option>"}).join("")+"</optgroup>"});
    addSel.innerHTML=h;addSel.setAttribute("aria-label",tr("add").replace("+ ",""));
    if(attached)attach2form();
  }

  /* Поля вводу */
  function readInputs(){
    var lim={L:[150,1200,100],W:[150,1200,100],H:[200,450,100],dn:[0,6,1],wn:[0,6,1]},ok=true;
    Object.keys(lim).forEach(function(k){
      var v=parseFloat(String(inp[k].value).replace(",",".")),l=lim[k];
      v=k==="dn"||k==="wn"?Math.round(v):Math.round(v*l[2]/(l[2]>1?5:1))*(l[2]>1?5:1);
      var good=isFinite(v)&&v>=l[0]&&v<=l[1];inp[k].setAttribute("aria-invalid",!good);
      if(good)st[k]=v;else ok=false;
    });
    return ok;
  }
  function changed(){
    fixDoor();
    if(st.edited)st.items.forEach(clamp);else pick();
    draw();save();
  }
  Object.keys(inp).forEach(function(k){inp[k].addEventListener("input",function(){if(readInputs())changed()})});
  dwSel.addEventListener("change",function(){st.dw=+dwSel.value;changed()});
  addSel.addEventListener("change",function(){
    var k=addSel.value;if(!LIB[k])return;addSel.value="";
    var b=LIB[k],all=[0,1,2,3],it=null;
    if(b.corner){
      /* кутовий предмет пробуємо поставити в кожен кут кімнати */
      for(var o=0;o<4&&!it;o++){
        var c={k:k,w:b.w,w2:b.w2,d:b.d,o:o,x:0,y:0},f=fp(c);
        c.x=o===1||o===2?st.L-f.w:0;c.y=o>=2?st.W-f.h:0;
        if(canPlace(c,st.items)){st.items.push(c);it=c}
      }
    }else it=placeWall(k,all,"center",st.items)||placeFree(k,0,st.items);
    if(!it){it={k:k,w:b.w,d:b.d,o:0,x:0,y:0};if(b.corner)it.w2=b.w2;clamp(it);st.items.push(it)}
    it.id=uid++;sel=it.id;st.edited=true;draw();save();
    if(k==="custom"){ed.scrollIntoView({block:"nearest"});pe.n.focus();pe.n.select()}
  });
  $("pl-auto").addEventListener("click",function(){pick();draw();save()});

  /* План у заявку */
  function summary(){
    var A=st.L*st.W/1e4,head=tr("rooms")[st.room]+" "+fmt(st.L/100)+" × "+fmt(st.W/100)+" "+tr("m")+", "+tr("hgt")+" "+fmt(st.H/100)+" "+tr("m")+", "+fmt(A)+" "+tr("m2");
    return{head:head+", "+tr("items")+": "+st.items.length,
      full:head+". "+tr("furn")+": "+st.items.map(function(it){return nm(it)+" "+dims(it).replace(/ /g,"")}).join("; ")};
  }
  function attach2form(){
    var box=$("f-plan"),s=summary();
    box.querySelector("span").textContent=tr("att")+s.head+".";
    box.querySelector("button").setAttribute("aria-label",tr("rmAtt"));
    $("f-plan-v").value=s.full;box.hidden=false;attached=true;
  }
  $("pl-send").addEventListener("click",function(){
    attach2form();
    $("contact").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});
    setTimeout(function(){$("f-name").focus({preventScroll:true})},400);
  });
  $("f-plan").querySelector("button").addEventListener("click",function(){$("f-plan").hidden=true;$("f-plan-v").value="";attached=false});

  /* Збереження в браузері */
  function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(_){}
    if(attached)attach2form();}
  function load(){
    try{
      var s=JSON.parse(localStorage.getItem(KEY)||"null");if(!s||ROOMS.indexOf(s.room)<0)return false;
      ["L","W","H","dn","wn","dw","dp"].forEach(function(k){if(typeof s[k]==="number")st[k]=s[k]});
      st.room=s.room;st.edited=!!s.edited;st.dw=((st.dw|0)%4+4)%4;st.L=lim(st.L);st.W=lim(st.W);fixDoor();
      st.items=(s.items||[]).filter(function(it){return LIB[it.k]&&[it.x,it.y,it.w,it.d,it.o].every(function(v){return typeof v==="number"})})
        .map(function(it){return{k:it.k,w:it.w,d:it.d,o:it.o%4,x:it.x,y:it.y,id:uid++,n:typeof it.n==="string"&&it.n?it.n.slice(0,40):undefined,
          h:typeof it.h==="number"&&it.h>=5&&it.h<=300?it.h:undefined,
          w2:LIB[it.k].corner?(typeof it.w2==="number"&&it.w2>=20?it.w2:LIB[it.k].w2):undefined}});
      return true;
    }catch(_){return false}
  }
  /* 3D: three.js завантажується лише тоді, коли планувальник з’являється на екрані */
  var box3=$("pl-3d"),st3=$("pl-3s"),v3state=0;/* 0 не завантажено, 1 завантажується, 2 готово, 3 помилка */
  var api={st:st,LIB:LIB,fp:fp,parts:parts,cd:cd,clamp:clamp,snap:snap,hOf:hOf,nm:nm,wlen:wlen,DW:DW,
    sel:function(id){if(id!==undefined){sel=id;update()}return sel},
    edited:function(){st.edited=true},update:update,save:save,
    resizeWall:resizeWall,moveDoor:moveDoor,afterRoomChange:afterRoomChange};
  function load3d(){
    if(v3state)return;v3state=1;st3.textContent=tr("load3");st3.hidden=false;
    import("./planner3d.js").then(function(m){
      V3=m.init(box3,api);v3state=2;st3.hidden=true;if(view==="3d")update();
    }).catch(function(err){
      v3state=3;if(window.console)console.warn(err);setView("2d");
      var w=$("pl-warn");w.hidden=false;w.textContent=tr("fail3");
    });
  }
  function setView(v,initial){
    if(v==="3d"&&v3state===3)v="2d";
    st3.textContent=tr("load3");
    view=v;
    $("pl-v3").classList.toggle("on",v==="3d");$("pl-v3").setAttribute("aria-pressed",v==="3d");
    $("pl-v2").classList.toggle("on",v==="2d");$("pl-v2").setAttribute("aria-pressed",v==="2d");
    box3.parentNode.hidden=v!=="3d";svg.parentNode.hidden=v!=="2d";
    $("pl-hint2").hidden=v!=="2d";$("pl-reset").parentNode.hidden=v!=="3d";$("pl-hint3").hidden=v!=="3d";
    if(v==="3d"){if(!initial)load3d();if(V3){V3.resize();update()}}
    else draw();
  }
  $("pl-v3").addEventListener("click",function(){setView("3d")});
  $("pl-v2").addEventListener("click",function(){setView("2d")});
  $("pl-reset").addEventListener("click",function(){if(V3)V3.reset(false)});
  $("pl-topv").addEventListener("click",function(){if(V3)V3.reset(true)});
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){io.disconnect();if(view==="3d")load3d()}},{rootMargin:"400px"});
    io.observe($("planner"));
  }else load3d();

  if(!load())pick();
  inp.L.value=st.L/100;inp.W.value=st.W/100;inp.H.value=st.H/100;inp.dn.value=st.dn;inp.wn.value=st.wn;
  texts();draw();setView("3d",true);
  new MutationObserver(function(){texts();draw()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
})();
