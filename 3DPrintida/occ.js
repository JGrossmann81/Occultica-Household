/* Creatures from the Occultica game, made printable. The shape code below is copied from the game (js/01_code.js)
   and runs on the same three.js library; occ.js then turns the pieces into one set of triangles. */
(function(){
var THREE=null;
function lib(){THREE=window.THREE;}
var B=null;function boot(){lib();
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0,flatShading:true},o||{}));
function mk(p,geo,mat,x,y,z,o){const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);if(o&&o.r)m.rotation.set(o.r[0],o.r[1],o.r[2]);if(o&&o.s)m.scale.set(o.s[0],o.s[1],o.s[2]);m.castShadow=!(o&&o.ns);m.receiveShadow=true;p.add(m);return m}
const coneG=(r,h,s)=>{const g=new THREE.ConeGeometry(r,h,s||6);g.translate(0,h/2,0);return g},cylG=(a,b,h,s)=>{const g=new THREE.CylinderGeometry(a,b,h,s||6);g.translate(0,h/2,0);return g};
const EYE=(c)=>new THREE.MeshBasicMaterial({color:c});
function eyes(g,y,z,dx,c,r){[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(r||.04,6,5),EYE(c||0xffe040));e.position.set(s*dx,y,z);e.userData.keep=1;g.add(e)})}
function humanoid(o){const g=new THREE.Group(),w=o.w||1,sk=M(o.skin),cl=M(o.cloth),dk=M(o.dark||0x2a2018);
 [-1,1].forEach(s=>mk(g,cylG(.13*w,.15*w,.8,6),dk,s*.17*w,0,0));mk(g,new THREE.BoxGeometry(.58*w,.75,.34*w),cl,0,1.15,0);
 [-1,1].forEach(s=>{const a=mk(g,cylG(.09*w,.1*w,.72,6),o.fur?cl:sk,s*.4*w,1.45,0,{r:[0,0,s*.35]});a.geometry.translate(0,-.36,0);(g.userData.arms=g.userData.arms||[]).push(a);mk(g,new THREE.BoxGeometry(.2*w,.12,.3*w),dk,s*.17*w,.06,.05);});mk(g,new THREE.BoxGeometry(.6*w,.09,.36*w),M(0x4a3020),0,.82,0);
 mk(g,new THREE.SphereGeometry(.23,10,8),sk,0,1.78,0);eyes(g,1.82,.19,.09,o.eye||0xffe040);
 if(o.ears)[-1,1].forEach(s=>mk(g,new THREE.ConeGeometry(.08,.35,4),sk,s*.28,1.85,0,{r:[0,0,-s*1.4]}));
 if(o.tusks)[-1,1].forEach(s=>mk(g,new THREE.ConeGeometry(.04,.14,4),M(0xf0ead0),s*.07,1.7,.2,{r:[Math.PI,0,0],ns:1}));
 if(o.hood)mk(g,new THREE.ConeGeometry(.3,.55,8),cl,0,1.95,-.03);
 if(o.helmet)mk(g,new THREE.SphereGeometry(.25,8,6,0,6.3,0,1.5),M(0x9a9aa8,{metalness:.5,roughness:.4}),0,1.82,0);
 if(o.beard)mk(g,new THREE.ConeGeometry(.2,.5,6),M(0x8a5a2a),0,1.55,.12,{r:[Math.PI,0,0]});
 if(o.crown)for(let i=0;i<5;i++){const a=i/5*6.28;mk(g,new THREE.ConeGeometry(.05,.2,4),M(0xe0b84a,{emissive:0xb88a20,emissiveIntensity:.6}),Math.cos(a)*.18,2.07,Math.sin(a)*.18,{ns:1})}
 if(o.hair)mk(g,new THREE.SphereGeometry(.25,8,6,0,6.3,0,1.2),M(o.hair),0,1.82,-.02);
 if(o.glow){cl.emissive=new THREE.Color(0x40ffb0);cl.emissiveIntensity=.35}
 if(o.wrap)for(let i=0;i<4;i++)mk(g,new THREE.TorusGeometry(.3*w,.025,4,10),M(0xbfb690),0,.9+i*.22,0,{r:[Math.PI/2,0,0],ns:1});
 if(o.tail)mk(g,coneG(.15,1,5),sk,0,.5,-.3,{r:[-1.2,0,0]});
 const wp=o.weapon;if(wp==="sword"){mk(g,new THREE.BoxGeometry(.07,1,.03),M(0xd0d4dc,{metalness:.7,roughness:.3}),.5*w,1.2,.25,{r:[.6,0,0]});mk(g,new THREE.BoxGeometry(.3,.05,.06),M(0x6a4a2a),.5*w,.78,.4)}
 else if(wp==="axe"){mk(g,new THREE.CylinderGeometry(.04,.04,1.2,5),M(0x6a4a2a),.5*w,1.2,.2,{r:[.4,0,0]});mk(g,new THREE.BoxGeometry(.5,.35,.06),M(0x9a9aa8,{metalness:.6}),.5*w,1.65,.4)}
 else if(wp==="club")mk(g,new THREE.CylinderGeometry(.06,.16,1.2,6),M(0x6a4a2a),.52*w,1.2,.25,{r:[.5,0,0]});
 else if(wp==="dagger")mk(g,new THREE.BoxGeometry(.05,.5,.03),M(0xd0d4dc,{metalness:.7}),.45*w,1.15,.3,{r:[.8,0,0]});
 else if(wp==="staff"){mk(g,new THREE.CylinderGeometry(.04,.05,2.1,5),M(0x5a3a22),.5,1.05,.15);const o2=mk(g,new THREE.SphereGeometry(.14,10,8),M(0xb070ff,{emissive:0x8a40ff,emissiveIntensity:1.3}),.5,2.2,.15,{ns:1})}
 if(o.shield)mk(g,new THREE.CylinderGeometry(.35,.35,.06,10),M(0xb0b0c0,{metalness:.5}),-.5,1.2,.25,{r:[Math.PI/2,0,0]});
 g.scale.setScalar(o.s||1);return g}
function wolf(c){const g=new THREE.Group(),m=M(c);mk(g,new THREE.SphereGeometry(.5,10,8),m,0,.75,0,{s:[.7,.7,1.4]});mk(g,new THREE.SphereGeometry(.28,10,8),m,0,.95,.8);mk(g,new THREE.ConeGeometry(.14,.4,5),m,0,.88,1.1,{r:[Math.PI/2,0,0]});
 [-1,1].forEach(s=>{mk(g,new THREE.ConeGeometry(.08,.22,4),m,s*.14,1.2,.72);[.4,-.4].forEach(z=>mk(g,cylG(.07,.09,.6,5),m,s*.22,0,z))});mk(g,coneG(.1,.7,5),m,0,.8,-.9,{r:[-1.9,0,0]});eyes(g,1.02,1.02,.1,0xff4020,.035);g.scale.setScalar(1.3);return g}
function wraith(c){const g=new THREE.Group(),m=M(c,{transparent:true,opacity:.7,emissive:c,emissiveIntensity:.3,roughness:.5});mk(g,coneG(.75,2.1,9),m,0,0,0,{ns:1});for(let i=0;i<5;i++){const a=i/5*6.28;mk(g,coneG(.22,.8,4),m,Math.cos(a)*.55,-.25,Math.sin(a)*.55,{r:[0,0,Math.PI],ns:1})}
 mk(g,new THREE.SphereGeometry(.28,10,8),M(0x101820),0,2.0,0.05,{ns:1});eyes(g,2.02,.25,.1,0x80e0ff,.06);[-1,1].forEach(s=>mk(g,coneG(.1,.9,5),m,s*.55,1.6,.2,{r:[1.2,0,s*.7],ns:1}));g.position.y=.4;g.userData.float=1;return g}
function imp(c){const g=new THREE.Group(),m=M(c);mk(g,new THREE.SphereGeometry(.3,8,6),m,0,.8,0,{s:[1,1.2,1]});mk(g,new THREE.SphereGeometry(.2,8,6),m,0,1.25,0);eyes(g,1.28,.16,.07,0xffe040,.04);[-1,1].forEach(s=>{mk(g,new THREE.ConeGeometry(.05,.25,4),M(0x2a1a1a),s*.1,1.5,0);mk(g,new THREE.ConeGeometry(.35,.6,3),M(0x5a2a3a),s*.35,.95,-.15,{r:[0,0,s*-.9],ns:1})});mk(g,coneG(.05,.6,4),m,0,.6,-.25,{r:[-1,0,0]});g.userData.float=1;g.scale.setScalar(1.1);return g}
function demon(c,drake){const g=new THREE.Group(),m=M(c,{emissive:c,emissiveIntensity:.18}),dk=M(0x2a1410);mk(g,cylG(.55,.4,1.2,8),m,0,.9,0);mk(g,new THREE.SphereGeometry(.45,10,8),m,0,2.35,drake?.4:0,{s:drake?[.8,.8,1.3]:[1,1,1]});eyes(g,2.4,drake?.9:.38,.18,0xffe040,.07);
 [-1,1].forEach(s=>{mk(g,coneG(.1,.7,5),dk,s*.3,2.7,0,{r:[-.3,0,-s*.5]});mk(g,cylG(.16,.2,1.1,6),m,s*.75,1.5,0,{r:[0,0,s*.7]});mk(g,new THREE.ConeGeometry(1.2,1.8,3),M(0x3a1a18,{side:THREE.DoubleSide}),s*1.2,2.2,-.5,{r:[0,0,s*-1.2],ns:1});mk(g,cylG(.18,.22,.9,6),dk,s*.25,0,0)});
 mk(g,coneG(.2,1.5,5),m,0,.7,-.5,{r:[-1.7,0,0]});g.scale.setScalar(drake?1.9:1.6);return g}
function hydra(c){const g=new THREE.Group(),m=M(c,{roughness:.6});mk(g,new THREE.SphereGeometry(1,12,10),m,0,.8,0,{s:[1.4,.8,1.5]});g.userData.necks=[];
 for(let k=0;k<4;k++){const n=new THREE.Group();n.position.set((k-1.5)*.55,1.2,.6);for(let i=0;i<5;i++)mk(n,new THREE.SphereGeometry(.2-.01*i,8,6),m,0,.35*i+.1,.12*i*i*.4);const h=new THREE.Group();h.position.set(0,1.85,.75);mk(h,new THREE.SphereGeometry(.25,8,6),m,0,0,0,{s:[1,.8,1.4]});eyes(h,.08,.2,.1,0xffe040,.045);mk(h,new THREE.ConeGeometry(.04,.15,4),M(0xf0ead0),.08,-.15,.25,{r:[Math.PI,0,0],ns:1});n.add(h);g.add(n);g.userData.necks.push(n)}return g}
function scorpion(c){const g=new THREE.Group(),m=M(c);mk(g,new THREE.SphereGeometry(.6,10,8),m,0,.6,0,{s:[1,.55,1.3]});mk(g,new THREE.SphereGeometry(.3,8,6),m,0,.6,.9);eyes(g,.78,1.1,.1,0xff3020,.045);
 for(let i=0;i<5;i++)mk(g,new THREE.SphereGeometry(.22-i*.02,8,6),m,0,.7+i*.28-i*i*.015,-.9-i*.15+i*i*.06);mk(g,coneG(.07,.35,4),M(0x3a1a10),0,1.8,-.85,{r:[1.4,0,0]});
 [-1,1].forEach(s=>{mk(g,new THREE.BoxGeometry(.5,.18,.7),m,s*.65,.55,1.05,{r:[0,s*.4,0]});for(let k=0;k<3;k++)mk(g,cylG(.04,.04,.7,4),m,s*.5,.2,.4-k*.45,{r:[0,0,s*-1.1]})});g.scale.setScalar(1.3);return g}
function beholder(c){const g=new THREE.Group(),m=M(c,{flatShading:false,roughness:.5});mk(g,new THREE.SphereGeometry(1.1,16,12),m,0,1.6,0);const e=mk(g,new THREE.SphereGeometry(.5,12,10),M(0xf4f0e0,{flatShading:false}),0,1.7,.75,{ns:1});mk(g,new THREE.SphereGeometry(.28,10,8),new THREE.MeshBasicMaterial({color:0x40ff80}),0,1.7,1.15).userData.keep=1;mk(g,new THREE.SphereGeometry(.14,8,6),new THREE.MeshBasicMaterial({color:0x000000}),0,1.7,1.35).userData.keep=1;
 g.userData.stalks=[];for(let i=0;i<7;i++){const a=(i/7)*Math.PI-.1,s=new THREE.Group();s.position.set(Math.cos(a+Math.PI/2)*.7,2.2+Math.sin(a)*.2,.2);mk(s,cylG(.07,.09,.9,5),m,0,0,0);const ey=mk(s,new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:0xff4060}),0,.95,0,{ns:1});ey.userData.keep=1;s.rotation.z=(i-3)*.38;g.add(s);g.userData.stalks.push(s)}
 for(let i=0;i<10;i++){const a=i/10*3.14+3.14;mk(g,new THREE.ConeGeometry(.05,.2,4),M(0xf0ead0),Math.cos(a)*.45,.9+Math.sin(a)*.12,.85,{r:[Math.PI,0,0],ns:1})}g.userData.float=1;return g}
const HUM=[[/Goblin/,{s:.85,skin:0x6b9a3a,cloth:0x5a4228,ears:1,weapon:"dagger"}],[/Orc/,{s:1.2,w:1.35,skin:0x4f7a3a,cloth:0x4a3a30,tusks:1,weapon:"axe"}],[/Nymph/,{w:.8,skin:0x9fe0cf,cloth:0x3f9a6a,glow:1,hair:0x3f7a3a,eye:0x80ffd0}],
 [/Magician/,{skin:0xd8b8a0,cloth:0x4a2a6a,hood:1,weapon:"staff"}],[/Yeti/,{s:1.8,w:1.5,skin:0xe8eef2,cloth:0xdde6ec,fur:1,eye:0x40a0ff}],[/Dwarf|Gorrum/,{s:.85,w:1.4,skin:0xd8a880,cloth:0x6a4a2a,beard:1,helmet:1,weapon:"axe"}],
 [/Giant/,{s:2.6,w:1.5,skin:0xc09070,cloth:0x6a5a40,weapon:"club"}],[/Lizard/,{skin:0x5a8a4a,cloth:0x3a5a3a,tail:1,weapon:"dagger",eye:0xff6020}],[/Bandit/,{skin:0xd8b090,cloth:0x4a4036,hood:1,weapon:"dagger"}],
 [/Mummy|King/,{skin:0xd8d0b0,cloth:0xd8d0b0,wrap:1,crown:1,eye:0x60ff90}],[/Paladin/,{skin:0xd8b8a0,cloth:0xb0b0c0,helmet:1,weapon:"sword",shield:1}]];
B={humanoid:humanoid,wolf:wolf,wraith:wraith,imp:imp,demon:demon,hydra:hydra,scorpion:scorpion,beholder:beholder,HUM:HUM,M:M,mk:mk};}
/* ---- turning a three.js group into printable triangles ---- */
var LIST=[
 ['goblin','Goblin',function(){return B.humanoid(hum(/Goblin/))}],['orc','Orc',function(){return B.humanoid(hum(/Orc/))}],['nymph','Nymph',function(){return B.humanoid(hum(/Nymph/))}],
 ['magician','Magician with staff',function(){return B.humanoid(hum(/Magician/))}],['yeti','Yeti',function(){return B.humanoid(hum(/Yeti/))}],['dwarf','Dwarf',function(){return B.humanoid(hum(/Dwarf/))}],
 ['giant','Giant',function(){return B.humanoid(hum(/Giant/))}],['lizard','Lizardman',function(){return B.humanoid(hum(/Lizard/))}],['bandit','Bandit',function(){return B.humanoid(hum(/Bandit/))}],
 ['mummy','Mummy king',function(){return B.humanoid(hum(/Mummy/))}],['paladin','Paladin',function(){return B.humanoid(hum(/Paladin/))}],
 ['wolf','Wolf',function(){return B.wolf(0x777777)}],['wraith','Wraith',function(){return B.wraith(0x88aacc)}],['imp','Imp',function(){return B.imp(0xaa4444)}],
 ['demon','Demon',function(){return B.demon(0xaa3322,false)}],['drake','Drake',function(){return B.demon(0x336644,true)}],['hydra','Hydra',function(){return B.hydra(0x3a7a4a)}],
 ['scorpion','Scorpion',function(){return B.scorpion(0x8a5a2a)}],['beholder','Beholder',function(){return B.beholder(0x7a3a8a)}]
];
function hum(re){for(var i=0;i<B.HUM.length;i++)if(B.HUM[i][0].test(re.source))return B.HUM[i][1];return B.HUM.find(function(h){return h[0].source===re.source})[1]}
function wk(p,a,b){return p+'|'+a+'|'+b}
/* close any open rim (hats are partial spheres) with a fan so every piece is a sealed solid */
function seal(P){ // P: Float32 non-indexed positions in three coords
  var key=function(i){return Math.round(P[i]*1e4)+','+Math.round(P[i+1]*1e4)+','+Math.round(P[i+2]*1e4)};
  var out=[],edges=new Map();
  for(var t=0;t<P.length;t+=9){
    var k=[key(t),key(t+3),key(t+6)];
    if(k[0]===k[1]||k[1]===k[2]||k[0]===k[2])continue; // collapsed (sphere poles)
    for(var j=0;j<9;j++)out.push(P[t+j]);
    for(var e=0;e<3;e++){var a=k[e],b=k[(e+1)%3];edges.set(a+'>'+b,[t+e*3,t+((e+1)%3)*3])}
  }
  var open=[];edges.forEach(function(v,kk){var s=kk.split('>');if(!edges.has(s[1]+'>'+s[0]))open.push([s[0],s[1],v])});
  if(!open.length)return Float32Array.from(out);
  var next=new Map();open.forEach(function(o){next.set(o[0],o)});
  var used=new Set();
  open.forEach(function(o){
    if(used.has(o[0]))return;var loop=[],cur=o,guard=0;
    while(cur&&!used.has(cur[0])&&guard++<5000){used.add(cur[0]);loop.push(cur);cur=next.get(cur[1])}
    if(loop.length<3)return;
    var cx=0,cy=0,cz=0;loop.forEach(function(l){cx+=P[l[2][0]];cy+=P[l[2][0]+1];cz+=P[l[2][0]+2]});cx/=loop.length;cy/=loop.length;cz/=loop.length;
    loop.forEach(function(l){var a=l[2][0],b=l[2][1]; // reverse the boundary edge to close the surface
      out.push(P[b],P[b+1],P[b+2],P[a],P[a+1],P[a+2],cx,cy,cz)});
  });
  return Float32Array.from(out);
}
function collect(g){
  g.updateMatrixWorld(true);var tris=[],thin=0,v=new THREE.Vector3(),sc=new THREE.Vector3();
  g.traverse(function(o){
    if(!o.isMesh||o.userData.keep)return; // eyes are skipped: they are tiny
    var geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry,pos=geo.attributes.position.array,
        W=new Float32Array(pos.length),m=o.matrixWorld;
    for(var i=0;i<pos.length;i+=3){v.set(pos[i],pos[i+1],pos[i+2]).applyMatrix4(m);W[i]=v.x;W[i+1]=v.y;W[i+2]=v.z}
    var S=seal(W);for(var j=0;j<S.length;j++)tris.push(S[j]);
    o.geometry.computeBoundingBox();var bb=o.geometry.boundingBox,sz=new THREE.Vector3();bb.getSize(sz);
    m.decompose(v,new THREE.Quaternion(),sc);o.userData._thin=Math.min(sz.x*sc.x,sz.y*sc.y,sz.z*sc.z);
  });
  return tris;
}
function build(id,height,base,t){
  if(!B){B=null;boot();}
  var item=LIST.find(function(x){return x[0]===id})||LIST[0],g=item[2](),tris=collect(g);
  // three: x right, y up, z toward viewer.  printer: x, y = -z, z = up (a plain turn, so the winding stays correct)
  var N=tris.length,mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9],P=new Float32Array(N);
  for(var i=0;i<N;i+=3){var x=tris[i],y=-tris[i+2],z=tris[i+1];P[i]=x;P[i+1]=y;P[i+2]=z;
    if(x<mn[0])mn[0]=x;if(y<mn[1])mn[1]=y;if(z<mn[2])mn[2]=z;if(x>mx[0])mx[0]=x;if(y>mx[1])mx[1]=y;if(z>mx[2])mx[2]=z}
  var k=height/Math.max(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]),cx=(mn[0]+mx[0])/2,cy=(mn[1]+mx[1])/2,lift=base?3:0;
  for(i=0;i<N;i+=3){P[i]=(P[i]-cx)*k;P[i+1]=(P[i+1]-cy)*k;P[i+2]=(P[i+2]-mn[2])*k+lift-(base?0.6:0)}
  var thin=0;g.traverse(function(o){if(o.isMesh&&!o.userData.keep&&o.userData._thin*k<1.0)thin++});
  for(i=0;i<P.length;i++)t.push(P[i]);
  if(base){var R=Math.max(mx[0]-mn[0],mx[1]-mn[1])*k*.5*0.9+4;window.G3.tube(t,0,0,R,0,0,3,64)}
  return {thin:thin,n:g.children.length,radius:Math.max(mx[0]-mn[0],mx[1]-mn[1])*k/2};
}
window.OCC={list:LIST.map(function(x){return [x[0],x[1]]}),loaded:function(){return !!window.THREE},boot:function(){if(!B){lib();boot()}},build:build};
})();
