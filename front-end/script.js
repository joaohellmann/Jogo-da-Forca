let palavra;
let rodada;
let ponto;
let dica;
let exibicaoPalavra;
let numeroErro;
let tentativasRestante;

function esconder(id){
    document.getElementById(id).style.display ="none";
}

function mostrar(id){
    document.getElementById(id).style.display ="block";
}

function inicio(){
    esconderTudo();
    esconder("login");
    esconder("nome")
    esconder("senha")
    esconder("entrar")
    esconder("menu-inicial")
    mostrar("ver-perfil")

}

function entrar(){
    esconder("nome")
    esconder("senha")
    esconder("entrar")
    voltarMenu();
}

function esconderTudo(){
    esconder("tela-pausa");
    esconder("iniciar-jogo");
    esconder("ver-perfil");
    esconder("ver-ranking");
    document.querySelector(".tela-pausada").style.display = "none";

}

function voltarMenu() {
    esconderTudo();
    mostrar("menu-inicial");
}

function verPerfil() {
    esconder("menu-inicial");
    mostrar("ver-perfil");
}

function abrirRanking() {
    esconder("menu-inicial");
    mostrar("ver-ranking");
}

async function sortearPalavra(){
    const resposta = await fetch("http://127.0.0.1:8000/sortear-palavra");

    const dados = await resposta.json();

    console.log(dados)

    palavra = dados.palavra;
    dica = dados.dica;
}

async function iniciarJogo() {
    esconder("menu-inicial");
    mostrar("iniciar-jogo");
    esconder("termo-correta");

    document.querySelectorAll(".tecla").forEach(function(tecla) {
        tecla.style.display = "block";
    });

    document.getElementById("mensagem").innerHTML= ""

    document.querySelectorAll(".botao-letra").forEach(botao => {
        botao.disabled = false;
    });

    numeroErro = 0;
    await carregarJogo();
}

async function carregarJogo(){
    await sortearPalavra();

    document.getElementById("termo-correta").innerHTML = palavra;
    document.getElementById("round").innerHTML = rodada;
    document.getElementById("pontuacao").innerHTML = ponto;
    document.getElementById("dica").innerHTML = dica;

    exibicaoPalavra = Array(palavra.length).fill("_");
    document.getElementById('termo').innerHTML = exibicaoPalavra.join("  ");
    document.getElementById("forca").src= `forca/forca${numeroErro}.jpeg`;
}

function verificarLetra(letra){
    
    if(palavra.includes(letra)){
        for (let i=0; i < palavra.length; i++){
            if(palavra[i] === letra){
                exibicaoPalavra[i] = letra;
            }
        }
    }else{
        numeroErro ++;
    }

    if(numeroErro === 6){
        encerrarJogo("Você perdeu")
    }else if(!exibicaoPalavra.includes("_")){
        encerrarJogo("Você acertou");
        setTimeout(()=>{
            console.log("passou 1 seg");
            ponto += 10 - (numeroErro * 2)
            rodada ++;
            if(rodada === 6){
                document.getElementById("pontuacao").innerHTML = ponto;
                encerrarJogo("Você Ganhou!!!")
            }else{
                iniciarJogo();
            }
        }, 1000);
    }
    
    document.getElementById('termo').innerHTML = exibicaoPalavra.join("  ");
    document.getElementById("forca").src= `forca/forca${numeroErro}.jpeg`;
}

function encerrarJogo(mensagem){
    mostrar("termo-correta");
    document.querySelectorAll(".botao-letra").forEach(botao => {
        botao.disabled = true;
    });

    document.getElementById("mensagem").innerHTML= mensagem;
}

function novoJogo(){
    rodada = 1;
    ponto = 0;

    document.getElementById("ideia").parentElement.disabled = false;

    iniciarJogo()
}

function clicarTecla(letra) {
    mostrar("tecla-" + letra);
    esconder("tecla-" + letra);
}

function ideia(){
    if(exibicaoPalavra.includes("_")){
        for(let i=0; i < exibicaoPalavra.length; i++){
            if(exibicaoPalavra[i] === "_"){
                exibicaoPalavra[i] = palavra[i];
                verificarLetra(palavra[i])
                clicarTecla(palavra[i])
                document.getElementById("ideia").parentElement.disabled = true;
                break
            }
        }
    }
}



function pausar(){
    mostrar("tela-pausa");
    document.querySelector(".tela-pausada").style.display = "block";
}

function voltarJogo(){
    esconder("tela-pausa");
    document.querySelector(".tela-pausada").style.display = "none";
}

document.querySelectorAll(".botao-letra").forEach(botao => { 
    botao.addEventListener("click" , ()=> {
    let letra = botao.dataset.letra;
    verificarLetra(letra);
    })
})