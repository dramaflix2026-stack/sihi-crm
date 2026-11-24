import Link from 'next/link';
export const metadata={title:'Entrar | SIHI CRM',description:'Tela de entrada do SIHI CRM'};
export default function Login(){
 return <main style={{minHeight:'100dvh',background:'#f7f7f5',display:'grid',placeItems:'center',padding:'24px 16px',fontFamily:'Poppins, Arial, sans-serif'}}>
  <section style={{width:'100%',maxWidth:440,padding:'clamp(24px,6vw,42px)',border:'1px solid #e8e8e4',borderRadius:22,background:'#fff',boxShadow:'0 12px 40px rgba(0,0,0,.045)',textAlign:'center'}}>
   <div aria-hidden="true" style={{width:76,height:76,margin:'0 auto 22px',display:'grid',placeItems:'center',borderRadius:20,background:'#ffd426',color:'#171717',fontSize:43,fontWeight:800}}>S</div>
   <div style={{fontSize:12,letterSpacing:2.4,fontWeight:700,color:'#a08000',marginBottom:12}}>GESTÃO DE RELACIONAMENTO</div>
   <h1 style={{fontSize:'clamp(25px,6vw,33px)',letterSpacing:'-.8px',lineHeight:1.2,color:'#191919',margin:'0 0 12px'}}>Bem-vindo ao SIHI CRM</h1>
   <p style={{color:'#727272',fontSize:14,lineHeight:1.65,margin:'0 0 28px'}}>Acesse sua central de clientes, acompanhamentos e oportunidades comerciais.</p>
   <Link href="/" style={{background:'#ffd426',color:'#161616',display:'block',padding:'15px 20px',borderRadius:12,fontSize:16,fontWeight:700,textDecoration:'none'}}>Entrar no CRM</Link>
   <p style={{fontSize:12,lineHeight:1.6,color:'#888',margin:'21px 0 0'}}>Acesso aberto, sem necessidade de usuário ou senha.</p>
  </section>
 </main>;
}
