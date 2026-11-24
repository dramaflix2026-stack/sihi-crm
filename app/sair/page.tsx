import Link from 'next/link';
export default function SairDoCRM(){
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f7f7f5',padding:20,fontFamily:'Arial, sans-serif'}}>
  <section style={{background:'#fff',border:'1px solid #e7e7e7',borderRadius:20,padding:32,maxWidth:460,width:'100%',textAlign:'center',boxShadow:'0 10px 35px rgba(0,0,0,.04)'}}>
   <div style={{width:64,height:64,borderRadius:17,background:'#ffda29',display:'grid',placeItems:'center',fontSize:34,fontWeight:800,margin:'0 auto 20px'}}>S</div>
   <h1 style={{fontSize:26,marginBottom:12,color:'#191919'}}>Você saiu do painel</h1>
   <p style={{color:'#626262',lineHeight:1.6,marginBottom:25}}>A visualização do SIHI CRM foi encerrada nesta página. Nenhum dado dos clientes foi alterado.</p>
   <Link href="/" style={{display:'inline-block',background:'#ffda29',color:'#1c1c1c',padding:'13px 24px',borderRadius:11,fontWeight:700,textDecoration:'none'}}>Voltar ao CRM</Link>
   <p style={{fontSize:12,color:'#848484',marginTop:22}}>O CRM é aberto e não utiliza sessões de login. Esta saída não bloqueia o acesso ao sistema.</p>
  </section>
 </main>;
}
