/* 3D-вигляд планувальника. Дані й логіка живуть у planner.js, тут лише показ і перетягування.
   Координати кімнати в сантиметрах; у сцені 1 одиниця = 1 м: X = (x + ox) / 100, Z = (y + oz) / 100. */
import * as THREE from "./three.module.min.js";

export function init(box, api){
  var st=api.st,PI=Math.PI;
  var R=new THREE.WebGLRenderer({antialias:true});
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
  R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
  var cv=R.domElement;box.appendChild(cv);

  var scene=new THREE.Scene();scene.background=new THREE.Color(0x17211C);
  var cam=new THREE.PerspectiveCamera(42,1,.05,200);
  scene.add(new THREE.HemisphereLight(0xfff3e2,0x2c3a30,1.15));
  var sun=new THREE.DirectionalLight(0xfff8ee,1.9);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
  scene.add(sun,sun.target);
  var roomG=new THREE.Group(),itemsG=new THREE.Group();scene.add(roomG,itemsG);
  var ox=0,oz=0,roomSig="",walls=[],doorPick=[],meshes={};
  var reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;

  function M(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:0},o||{}))}
  var MAT={wood:M(0xB58A5C,{roughness:.65}),dark:M(0x5B4430),white:M(0xEAE6DD,{roughness:.55}),fabric:M(0x6C8A7A,{roughness:.95}),
    fabric2:M(0x81A090,{roughness:.95}),linen:M(0xF1EDE4,{roughness:.95}),pillow:M(0xFFFFFF,{roughness:.9}),
    metal:M(0x2A2A2A,{roughness:.35,metalness:.6}),steel:M(0xBFC4C8,{roughness:.3,metalness:.7}),screen:M(0x0D0E10,{roughness:.2}),
    counter:M(0x3A3A3A,{roughness:.45}),fridge:M(0xDCDFE2,{roughness:.3,metalness:.2}),mirror:M(0xC8D5DD,{roughness:.08,metalness:.85}),
    custom:M(0x9CC2AB,{roughness:.7}),slab:M(0x0F1512,{roughness:1}),leaf:M(0xC9A27A,{roughness:.6}),hit:new THREE.MeshBasicMaterial({visible:false})};
  var BOX=new THREE.BoxGeometry(1,1,1);

  /* Підлога: дошки, намальовані на canvas. 512 px = 160 см. */
  var floorTex=(function(){
    var c=document.createElement("canvas");c.width=c.height=512;var g=c.getContext("2d"),seed=7;
    function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
    var rows=8,rh=512/rows;
    for(var r=0;r<rows;r++){
      var x=-rnd()*300;
      while(x<512){
        var len=160+rnd()*260,l=46+rnd()*12;
        [0,-512].forEach(function(sh){
          g.fillStyle="hsl(31,38%,"+l+"%)";g.fillRect(x+sh,r*rh,len,rh);
          g.strokeStyle="rgba(70,45,25,.18)";g.lineWidth=1;
          for(var k=0;k<4;k++){var yy=r*rh+6+rnd()*(rh-12);g.beginPath();g.moveTo(x+sh,yy);g.bezierCurveTo(x+sh+len*.3,yy+3,x+sh+len*.6,yy-3,x+sh+len,yy);g.stroke()}
          g.strokeStyle="rgba(50,32,18,.55)";g.strokeRect(x+sh+.5,r*rh+.5,len-1,rh-1);
        });
        x+=len;
      }
    }
    var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=R.capabilities.getMaxAnisotropy();return t;
  })();

  var floorMat=new THREE.MeshStandardMaterial({map:floorTex,roughness:.7});
  function mesh(mat,sx,sy,sz,x,y,z,parent){
    var m=new THREE.Mesh(BOX,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function disposeTree(o){o.traverse(function(n){if(n.geometry&&n.geometry!==BOX)n.geometry.dispose()})}

  /* Кімната */
  function buildRoom(){
    roomG.children.slice().forEach(function(o){roomG.remove(o);disposeTree(o)});
    walls.forEach(function(w){w.mats.forEach(function(m){m.dispose()})});
    walls=[];doorPick=[];
    var L=st.L,W=st.W,H=st.H,t=10,ow=(st.dw+2)%4;
    var fl=new THREE.Mesh(new THREE.PlaneGeometry(L/100,W/100),floorMat);
    floorTex.repeat.set(L/160,W/160);
    fl.rotation.x=-PI/2;fl.position.set((ox+L/2)/100,0,(oz+W/2)/100);fl.receiveShadow=true;roomG.add(fl);
    mesh(MAT.slab,(L+2*t+20)/100,.1,(W+2*t+20)/100,(ox+L/2)/100,-.051,(oz+W/2)/100,roomG).castShadow=false;
    /* прямокутник у системі стіни (u вздовж, v від кімнати назовні від’ємне) → центр і розміри в кімнаті */
    function toRoom(w,u0,u1,v0,v1){
      var u=(u0+u1)/2,v=(v0+v1)/2,su=u1-u0,sv=v1-v0;
      if(w===0)return{x:u,y:v,sx:su,sy:sv};
      if(w===2)return{x:u,y:W-v,sx:su,sy:sv};
      if(w===3)return{x:v,y:u,sx:sv,sy:su};
      return{x:L-v,y:u,sx:sv,sy:su};
    }
    function part(w,mat,u0,u1,v0,v1,z0,z1,g){
      var r=toRoom(w,u0,u1,v0,v1);
      return mesh(mat,r.sx/100,(z1-z0)/100,r.sy/100,(r.x+ox)/100,(z0+z1)/200,(r.y+oz)/100,g);
    }
    for(var w=0;w<4;w++){
      var len=api.wlen(w),ext=w%2?0:t,g=new THREE.Group();roomG.add(g);
      var wm=M(0xE6E0D4,{roughness:.95}),fm=M(0xF6F4EF,{roughness:.5}),gm=M(0xBFE3FF,{roughness:.05,transparent:true,opacity:.28});
      wm.userData.base=1;fm.userData.base=1;gm.userData.base=.28;
      var op=null;
      if(st.dn>0&&w===st.dw)op={a:st.dp,b:st.dp+api.DW,z0:0,z1:Math.min(210,H-10),door:1};
      else if(st.wn>0&&w===ow)op={a:len/2-70,b:len/2+70,z0:90,z1:Math.min(240,H-15)};
      var segs=op?[[-ext,op.a,0,H],[op.b,len+ext,0,H],[op.a,op.b,op.z1,H]].concat(op.z0>0?[[op.a,op.b,0,op.z0]]:[]):[[-ext,len+ext,0,H]];
      var ms=segs.filter(function(s){return s[1]-s[0]>.5&&s[3]-s[2]>.5}).map(function(s){var m=part(w,wm,s[0],s[1],-t,0,s[2],s[3],g);m.userData.wall=w;return m});
      if(op){
        /* лиштва навколо прорізу */
        part(w,fm,op.a-6,op.a,-t-1,1.5,op.z0,op.z1+6,g);part(w,fm,op.b,op.b+6,-t-1,1.5,op.z0,op.z1+6,g);
        part(w,fm,op.a-6,op.b+6,-t-1,1.5,op.z1,op.z1+6,g);
        if(op.door){
          /* відчинене полотно дверей і невидима зона для перетягування */
          var leaf=new THREE.Group();roomG.add(leaf);
          var a=part(w,MAT.leaf,op.a+5,op.a+9,0,80,0,205,leaf);
          var k=part(w,MAT.steel,op.a+9,op.a+12,70,74,95,99,leaf);
          var hit=part(w,MAT.hit,op.a,op.b,-t,20,0,210,roomG);hit.castShadow=hit.receiveShadow=false;
          a.userData.door=k.userData.door=hit.userData.door=1;doorPick.push(a,k,hit);
        }else{
          part(w,fm,op.a-6,op.b+6,-t-2,4,op.z0-4,op.z0,g);
          part(w,gm,op.a,op.b,-t/2-1,-t/2+1,op.z0,op.z1,g).castShadow=false;
          part(w,fm,len/2-2,len/2+2,-t/2-2,-t/2+2,op.z0,op.z1,g);
        }
      }
      var n=[new THREE.Vector3(0,0,-1),new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(-1,0,0)][w];
      var cr=toRoom(w,0,len,-t,0);
      walls[w]={g:g,meshes:ms,mats:[wm,fm,gm],n:n,c:new THREE.Vector3((cr.x+ox)/100,H/200,(cr.y+oz)/100),faded:false};
    }
    var s=Math.max(L,W)/100*.8+1,sc=sun.shadow.camera;
    sc.left=sc.bottom=-s;sc.right=sc.top=s;sc.near=.5;sc.far=40;sc.updateProjectionMatrix();
  }

  /* Меблі: модель у сантиметрах, центр сліду на підлозі, спинка до -z, перед до +z */
  function model(it){
    var g=new THREE.Group(),w=it.w,d=it.d,h=api.hOf(it),k=it.k,i;
    function B(bw,bh,bd,x,y,z,m){return mesh(m,bw,bh,bd,x,y+bh/2,z,g)}
    function legs(lw,ld,lh,ins,m){[-1,1].forEach(function(a){[-1,1].forEach(function(b){B(4,lh,4,a*(lw/2-ins),0,b*(ld/2-ins),m)})})}
    function grooves(n,hgt,y0,zf){for(var j=1;j<n;j++)B(.8,hgt,.6,-w/2+j*w/n,y0,zf,MAT.dark)}
    if(api.LIB[k].corner){
      /* кутовий: права сторона вздовж -z (ширина w), ліва вздовж -x (довжина w2), центр — середина габариту */
      var w2=it.w2,cd=api.cd(it),x0=-w/2,z0=-w2/2,zc=z0+cd+(w2-cd)/2,l2=w2-cd;
      var arms=function(hh,y,m,inset){B(w-(inset||0),hh,cd,(inset||0)/2,y,z0+cd/2,m);B(cd,hh,l2,x0+cd/2,y,zc,m)};
      if(k==="cdesk"){
        arms(3,h-3,MAT.wood);
        [[w/2-4,z0+4],[w/2-4,z0+cd-4],[x0+4,w2/2-4],[x0+cd-4,w2/2-4],[x0+4,z0+4]].forEach(function(p){B(4,h-3,4,p[0],0,p[1],MAT.dark)});
        B(40,h-20,cd-6,w/2-24,0,z0+cd/2,MAT.wood);
        if(w-cd>=70){B(60,36,3,x0+cd+(w-cd)/2,h+10,z0+10,MAT.screen);B(14,10,12,x0+cd+(w-cd)/2,h,z0+10,MAT.metal)}
      }else if(k==="csofa"){
        arms(36,6,MAT.fabric);
        B(w,h-6,20,0,6,z0+10,MAT.fabric);B(20,h-6,w2-20,x0+10,6,z0+20+(w2-20)/2,MAT.fabric);
        B(18,52,cd,w/2-9,6,z0+cd/2,MAT.fabric);B(cd,52,18,x0+cd/2,6,w2/2-9,MAT.fabric);
        B(w-38,10,cd-22,1,42,z0+20+(cd-22)/2,MAT.fabric2);
        B(cd-22,10,l2-18,x0+20+(cd-22)/2,42,z0+cd+(l2-18)/2,MAT.fabric2);
      }else if(k==="ckit"){
        arms(10,0,MAT.dark,0);arms(h-14,10,MAT.white);arms(4,h-4,MAT.counter);
        if(w-cd>=60)B(50,1,40,x0+cd+(w-cd)/2,h,z0+cd/2,MAT.steel);
        if(l2>=60)B(48,1,56,x0+cd/2,h,zc,MAT.screen);
        if(!(st.wn>0&&(it.o===(st.dw+2)%4||(it.o+3)%4===(st.dw+2)%4))){B(w,70,35,0,145,z0+17.5,MAT.white);B(35,70,w2-35,x0+17.5,145,z0+35+(w2-35)/2,MAT.white)}
      }else if(k==="cward"){
        arms(h,0,MAT.white);arms(4,h-4,MAT.wood);
        for(i=1;i<Math.round(w/60);i++)B(.8,h-8,.6,x0+cd+(w-cd)*i/Math.round(w/60),4,z0+cd+.2,MAT.dark);
        for(i=1;i<Math.round(w2/60);i++)B(.6,h-8,.8,x0+cd+.2,4,z0+cd+l2*i/Math.round(w2/60),MAT.dark);
      }else arms(h,0,MAT.custom);
    }else if(k.indexOf("bed")===0){
      legs(w,d,8,6,MAT.dark);B(w,22,d,0,8,0,MAT.wood);
      B(w-8,20,d-14,0,30,3,MAT.linen);
      B(w,h,8,0,0,-d/2+4,MAT.wood);
      var n=w>=140?2:1,pw=(w-30-(n-1)*8)/n;
      for(i=0;i<n;i++)B(pw,12,36,-w/2+15+pw/2+i*(pw+8),50,-d/2+30,MAT.pillow);
      B(w-6,4,d*.55,0,49,d/2-d*.275-5,MAT.fabric);
    }else if(k==="night"||k==="shoe"){
      var m=k==="shoe"?MAT.white:MAT.wood;B(w,h-6,d,0,6,0,m);legs(w,d,6,4,MAT.dark);
      B(w-6,.8,.6,0,h*.55,d/2+.2,MAT.dark);B(10,1.5,2,0,h*.75,d/2+1,MAT.steel);
    }else if(k==="dresser"){
      B(w,h-8,d,0,8,0,MAT.wood);legs(w,d,8,4,MAT.dark);
      for(i=1;i<4;i++)B(w-6,.8,.6,0,8+(h-8)*i/4,d/2+.2,MAT.dark);
      for(i=0;i<4;i++)B(12,1.5,2,0,8+(h-8)*(i+.5)/4,d/2+1,MAT.steel);
    }else if(k==="ward"||k==="hward"){
      B(w,h,d,0,0,0,MAT.white);
      var nd=Math.max(2,Math.round(w/(k==="ward"?100:75)));
      grooves(nd,h-8,4,d/2+.2);
      if(nd>=3)B(w/nd-16,h-40,.6,-w/2+w/nd*1.5,20,d/2+.4,MAT.mirror);
      B(w,4,d,0,h-4,0,MAT.wood);
    }else if(k==="shelf"){
      B(2,h,d,-w/2+1,0,0,MAT.wood);B(2,h,d,w/2-1,0,0,MAT.wood);B(w,h,1,0,0,-d/2+.5,MAT.dark);
      for(i=0;i<=5;i++)B(w-4,2,d,0,i*(h-2)/5,0,MAT.wood);
    }else if(k==="sofa"||k==="arm"){
      legs(w,d,6,8,MAT.dark);B(w,36,d,0,6,0,MAT.fabric);
      B(w,h-6,20,0,6,-d/2+10,MAT.fabric);
      B(18,58-6,d,-w/2+9,6,0,MAT.fabric);B(18,58-6,d,w/2-9,6,0,MAT.fabric);
      var nc=w>150?3:1,cw=(w-36)/nc;
      for(i=0;i<nc;i++)B(cw-2,10,d-26,-w/2+18+cw*(i+.5),42,10,MAT.fabric2);
    }else if(k==="ctable"||k.indexOf("dt")===0||k==="desk"){
      B(w,4,d,0,h-4,0,MAT.wood);legs(w,d,h-4,5,MAT.dark);
      if(k==="desk")B(40,h-20,d-6,w/2-22,0,0,MAT.wood);
    }else if(k==="chair"){
      legs(w,d,43,3,MAT.dark);B(w,4,d,0,43,0,MAT.wood);B(w,h-47,3,0,47,-d/2+1.5,MAT.wood);
    }else if(k==="tv"){
      B(w,h-6,d,0,6,0,MAT.wood);legs(w,d,6,5,MAT.dark);grooves(3,h-12,9,d/2+.2);
      var tw=Math.min(w-20,125);B(20,8,14,0,h,-d/2+12,MAT.metal);B(tw,tw*.57,4,0,h+8,-d/2+12,MAT.screen);
    }else if(k==="kset"){
      B(w,10,d-6,0,0,-3,MAT.dark);B(w,h-14,d-3,0,10,-1.5,MAT.white);B(w,4,d,0,h-4,0,MAT.counter);
      grooves(Math.max(1,Math.round(w/60)),h-20,12,d/2-2.7);
      if(w>=120){B(50,1,40,w/4,h,0,MAT.steel);B(56,1,48,-w/4,h,0,MAT.screen)}
      if(!(st.wn>0&&it.o===(st.dw+2)%4)){B(w,70,35,0,145,-d/2+17.5,MAT.white);grooves(Math.max(1,Math.round(w/60)),66,147,-d/2+35.2)}
    }else if(k==="fridge"){
      B(w,h,d,0,0,0,MAT.fridge);B(w-2,.8,.6,0,h*.62,d/2+.2,MAT.dark);
      B(2,40,3,w/2-6,h*.62+10,d/2+1.5,MAT.steel);B(2,40,3,w/2-6,h*.62-50,d/2+1.5,MAT.steel);
    }else if(k==="bench"){
      legs(w,d,h-8,4,MAT.dark);B(w,8,d,0,h-8,0,MAT.fabric);
    }else if(k==="hanger"){
      B(w,h,3,0,0,-d/2+1.5,MAT.wood);B(w,2,d,0,h-12,0,MAT.wood);
      for(i=0;i<4;i++)B(2,2,10,-w/2+w*(i+.5)/4,h-40,-d/2+7,MAT.steel);
    }else{
      B(w,h,d,0,0,0,MAT.custom);
    }
    var bb=new THREE.Box3().setFromObject(g),sz=bb.getSize(new THREE.Vector3()),ctr=bb.getCenter(new THREE.Vector3());
    var ol=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sz.x+3,sz.y+3,sz.z+3)),new THREE.LineBasicMaterial({color:0x9AD1AE}));
    ol.position.copy(ctr);ol.visible=false;ol.raycast=function(){};g.add(ol);
    g.scale.setScalar(.01);g.userData.id=it.id;
    return{g:g,ol:ol};
  }
  function modelKey(it){return[it.k,it.w,it.w2,it.d,it.k==="ckit"?it.o+"/"+st.dw+"/"+st.wn:"",api.hOf(it),it.k==="kset"&&st.wn>0&&it.o===(st.dw+2)%4?1:0].join()}
  function drop(id){var m=meshes[id];itemsG.remove(m.g);disposeTree(m.g);m.ol.material.dispose();delete meshes[id]}

  /* Камера */
  var orb={th:.55,ph:.95,r:6},tgt=new THREE.Vector3(),goalV=new THREE.Vector3(),dragging=false;
  function goal(){goalV.set((ox+st.L/2)/100,.5,(oz+st.W/2)/100)}
  /* відстань, з якої вся кімната вміщається в кадр за поточних пропорцій екрана */
  function fitR(){
    var d=Math.hypot(st.L,st.W)/200+.3,vf=cam.fov*PI/360,hf=Math.atan(Math.tan(vf)*cam.aspect);
    return d/Math.tan(Math.min(vf,hf));
  }
  function reset(top){orb.th=top?0:.55;orb.ph=top?.06:.95;orb.r=fitR()*(top?1.05:1);goal();tgt.copy(goalV);dirty()}

  var raf=0;
  function dirty(){if(!raf)raf=requestAnimationFrame(frame)}
  function frame(){
    raf=0;
    if(!dragging){tgt.lerp(goalV,reduce?1:.18);if(tgt.distanceTo(goalV)>.002)dirty();else tgt.copy(goalV)}
    var sp=Math.sin(orb.ph);
    cam.position.set(tgt.x+orb.r*sp*Math.sin(orb.th),tgt.y+orb.r*Math.cos(orb.ph),tgt.z+orb.r*sp*Math.cos(orb.th));
    cam.lookAt(tgt);
    sun.position.set(tgt.x+3,tgt.y+8,tgt.z+4.5);sun.target.position.copy(tgt);
    /* стіни між камерою й кімнатою стають прозорими */
    walls.forEach(function(w){
      if(!w||!w.n)return;
      var f=orb.ph>.12&&cam.position.clone().sub(w.c).dot(w.n)>0;
      if(f===w.faded)return;w.faded=f;
      w.mats.forEach(function(m){m.transparent=f||m.userData.base<1;m.opacity=f?.1*m.userData.base:m.userData.base;m.depthWrite=!f;m.needsUpdate=true});
      w.meshes.forEach(function(m){m.castShadow=!f});
    });
    R.render(scene,cam);
  }
  function resize(){
    var w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
    R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();dirty();
  }
  if(window.ResizeObserver)new ResizeObserver(resize).observe(box);else window.addEventListener("resize",resize);

  /* Вибір і перетягування */
  var ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),ptrs=new Map(),d3=null,hoverWall=-1;
  function setRay(e){var r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam)}
  function pickAt(e){
    setRay(e);
    var h=ray.intersectObjects(itemsG.children,true)[0];
    if(h){var o=h.object;while(o&&o.userData.id===undefined)o=o.parent;if(o)return{type:"item",id:o.userData.id,y:h.point.y}}
    h=ray.intersectObjects(doorPick,false)[0];if(h)return{type:"door",y:h.point.y};
    var wm=[];walls.forEach(function(w){if(w&&w.meshes&&!w.faded)wm=wm.concat(w.meshes)});
    h=ray.intersectObjects(wm,false)[0];if(h)return{type:"wall",w:h.object.userData.wall,y:h.point.y};
    return null;
  }
  function roomPt(e,y){
    setRay(e);var v=new THREE.Vector3();
    if(!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),v))return null;
    return{x:v.x*100-ox,y:v.z*100-oz};
  }
  function itemById(id){return st.items.filter(function(i){return i.id===id})[0]}
  function setHoverWall(w){
    if(hoverWall===w)return;
    if(walls[hoverWall])walls[hoverWall].mats[0].emissive.setHex(0);
    hoverWall=w;if(walls[w])walls[w].mats[0].emissive.setHex(0x1E3A2A);dirty();
  }
  cv.addEventListener("pointerdown",function(e){
    if(e.pointerType==="mouse"&&e.button!==0)return;
    e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size===2){
      var a=Array.from(ptrs.values());d3={mode:"pinch",d0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),r0:orb.r};dragging=false;return;
    }
    var h=pickAt(e);
    if(h&&h.type==="item"){
      var it=itemById(h.id),p=roomPt(e,h.y),f=api.fp(it);api.sel(h.id);
      d3={mode:"item",it:it,y:h.y,dx:p?p.x-f.x:0,dy:p?p.y-f.y:0,moved:false};cv.style.cursor="grabbing";
    }else if(h&&h.type==="door")d3={mode:"door",y:h.y,moved:false};
    else if(h&&h.type==="wall")d3={mode:"wall",w:h.w,y:h.y,moved:false};
    else d3={mode:"orbit",x:e.clientX,y:e.clientY,moved:false};
    dragging=d3.mode!=="orbit";
  });
  cv.addEventListener("pointermove",function(e){
    if(!d3){hover(e);return}
    if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    var p;
    if(d3.mode==="pinch"){
      if(ptrs.size<2)return;var a=Array.from(ptrs.values()),dd=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
      orb.r=Math.max(1.2,Math.min(40,d3.r0*d3.d0/Math.max(dd,1)));dirty();
    }else if(d3.mode==="orbit"){
      var dx=e.clientX-d3.x,dy=e.clientY-d3.y;if(Math.abs(dx)+Math.abs(dy)>2)d3.moved=true;
      orb.th-=dx*.008;orb.ph=Math.max(.06,Math.min(1.45,orb.ph-dy*.006));d3.x=e.clientX;d3.y=e.clientY;dirty();
    }else if(d3.mode==="item"){
      p=roomPt(e,d3.y);if(!p)return;
      var it=d3.it,nx=api.snap(p.x-d3.dx),ny=api.snap(p.y-d3.dy);
      if(nx===it.x&&ny===it.y)return;
      it.x=nx;it.y=ny;api.clamp(it);d3.moved=true;api.update();
    }else{
      p=roomPt(e,d3.y);if(!p)return;
      if(d3.mode==="wall")api.resizeWall(d3.w,p);else api.moveDoor(p);
      d3.moved=true;api.update();
    }
  });
  function up(e){
    ptrs.delete(e.pointerId);if(!d3)return;
    var m=d3;
    if(m.mode==="pinch"){if(!ptrs.size)d3=null;return}
    d3=null;dragging=false;cv.style.cursor="";
    if(m.mode==="orbit"&&!m.moved&&api.sel()!==null)api.sel(null);
    else if(m.mode==="item"&&m.moved){api.edited();api.save()}
    else if((m.mode==="wall"||m.mode==="door")&&m.moved)api.afterRoomChange();
    goal();dirty();
  }
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
  function hover(e){
    if(e.pointerType!=="mouse")return;
    var h=pickAt(e);
    cv.style.cursor=!h?"":h.type==="item"?"grab":h.type==="door"?"move":h.w%2?"ew-resize":"ns-resize";
    if(h&&h.type==="wall"){
      /* курсор відповідає напрямку, у якому стіна рухається на екрані */
      var n=walls[h.w].n.clone().applyMatrix4(cam.matrixWorldInverse.clone().setPosition(0,0,0));
      cv.style.cursor=Math.abs(n.x)>Math.abs(n.y)?"ew-resize":"ns-resize";
    }
    cv.title=h&&h.type==="item"?api.nm(itemById(h.id)):"";
    setHoverWall(h&&h.type==="wall"?h.w:-1);
  }
  cv.addEventListener("pointerleave",function(){if(!d3)setHoverWall(-1)});
  cv.addEventListener("wheel",function(e){e.preventDefault();orb.r=Math.max(1.2,Math.min(40,orb.r*Math.exp(e.deltaY*.0012)));dirty()},{passive:false});

  function sync(bad){
    var sig=[st.L,st.W,st.H,st.dn,st.wn,st.dw,st.dp,ox,oz].join();
    if(sig!==roomSig){roomSig=sig;buildRoom();hoverWall=-1}
    if(!dragging)goal();
    var seen={},sel=api.sel();
    st.items.forEach(function(it){
      var key=modelKey(it),m=meshes[it.id];
      if(!m||m.key!==key){if(m)drop(it.id);m=meshes[it.id]=model(it);m.key=key;itemsG.add(m.g)}
      seen[it.id]=1;
      var f=api.fp(it);m.g.position.set((f.x+f.w/2+ox)/100,0,(f.y+f.h/2+oz)/100);m.g.rotation.y=-it.o*PI/2;
      var b=!!(bad&&bad[it.id]);m.ol.visible=b||sel===it.id;m.ol.material.color.setHex(b?0xE0705F:0x9AD1AE);
    });
    Object.keys(meshes).forEach(function(id){if(!seen[id])drop(id)});
    dirty();
  }
  function shift(dx,dy){ox+=dx;oz+=dy}

  resize();reset(false);
  return{sync:sync,shift:shift,resize:resize,reset:reset};
}
