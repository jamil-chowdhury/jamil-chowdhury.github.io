
/* Grey felt background — two generated layers: a fine seamless wool tile, and a larger soft
   'pressed wool' cloud layer with a different repeat size, so no grid pattern shows. */
(function(){
  let a=20261115; const r=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  function tile(S,draw){const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
    // draw at (x,y) and at wrapped positions when touching an edge, so the tile repeats seamlessly
    const tiled=(x,y,m,fn)=>{for(const dx of[-S,0,S])for(const dy of[-S,0,S]){const X=x+dx,Y=y+dy;if(X>-m&&X<S+m&&Y>-m&&Y<S+m)fn(X,Y);}};
    draw(g,S,tiled);return c.toDataURL('image/png');}
  // 1) fine wool: specks, curly fibres, bobbles (on transparent so the cloud layer shows through)
  const wool=tile(768,(g,S,tiled)=>{
    for(let i=0;i<26000;i++){const x=r()*S,y=r()*S,l=r()<0.5,sz=0.8+r()*1.6,col=l?`rgba(255,255,255,${0.06+r()*0.14})`:`rgba(30,30,30,${0.05+r()*0.10})`;
      tiled(x,y,3,(X,Y)=>{g.fillStyle=col;g.fillRect(X,Y,sz,sz);});}
    g.lineCap='round';
    for(let i=0;i<12000;i++){const x=r()*S,y=r()*S,ang=r()*6.283,len=4+r()*18,bend=(r()-0.5)*1.8,w=0.5+r()*1.0,k=r();
      const col=k<0.47?`rgba(255,255,255,${0.14+r()*0.22})`:k<0.93?`rgba(45,45,45,${0.08+r()*0.14})`:k<0.97?`rgba(165,130,95,${0.3+r()*0.2})`:`rgba(105,140,175,${0.3+r()*0.2})`;
      tiled(x,y,len+2,(X,Y)=>{g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(X,Y);
        g.quadraticCurveTo(X+Math.cos(ang+bend)*len*0.5,Y+Math.sin(ang+bend)*len*0.5,X+Math.cos(ang)*len,Y+Math.sin(ang)*len);g.stroke();});}
    for(let i=0;i<160;i++){const x=r()*S,y=r()*S,rad=1+r()*2.4,l=r()<0.6;
      tiled(x,y,4,(X,Y)=>{g.fillStyle=l?'rgba(242,242,238,0.38)':'rgba(60,60,58,0.26)';g.beginPath();g.arc(X,Y,rad,0,6.283);g.fill();});}
  });
  // 2) soft density changes, like pressed wool (gentle, large, different repeat size)
  const clouds=tile(700,(g,S,tiled)=>{
    for(let i=0;i<120;i++){const x=r()*S,y=r()*S,rad=25+r()*90,dark=r()<0.5,al=0.025+r()*0.035;
      tiled(x,y,rad,(X,Y)=>{const gr=g.createRadialGradient(X,Y,0,X,Y,rad);gr.addColorStop(0,dark?`rgba(70,72,70,${al})`:`rgba(255,255,255,${al*1.2})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(X-rad,Y-rad,rad*2,rad*2);});}
  });
  const b=document.body.style;
  b.setProperty('--felt-wool',`url(${wool})`);
  b.backgroundImage=`url(${wool}), url(${clouds})`;
  b.backgroundSize='384px 384px, 910px 910px';
  b.backgroundRepeat='repeat, repeat';
})();
