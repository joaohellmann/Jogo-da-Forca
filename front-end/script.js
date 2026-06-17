let palavra;
let rodada;
let ponto;
let dica;
let exibicaoPalavra;
let numeroErro;
let tentativasRestante;

let token = localStorage.getItem("token");
let emailUsuario = localStorage.getItem("emailUsuario");

function esconder(id){
    document.getElementById(id).style.display ="none";
}

function mostrar(id){
    document.getElementById(id).style.display ="block";
}

function esconderPag(){
    esconder("tela-pausa");
    esconder("iniciar-jogo");
    esconder("ver-perfil");
    esconder("ver-ranking");
    esconder("menu-inicial");
    esconder("login");
    esconder("criar-conta");
}

function inicio(){
    esconderPag();
    mostrar("login"); 
}

function criarConta(){
    esconderPag();
    mostrar("criar-conta");
}


async function entrar(){

    const email = document.getElementById("email-login").value;
    const senha = document.getElementById("senha").value;

    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", senha);

    try{

        const resposta = await fetch(
            "http://127.0.0.1:8000/login",
            {
                method: "POST",
                body: formData
            }
        );

        const dados = await resposta.json();

        console.log(dados);

        localStorage.setItem(
            "token",
            dados.access_token
        );

        localStorage.setItem(
            "emailUsuario",
            dados.usuario.email
        );

        token = dados.access_token;
        emailUsuario = dados.usuario.email;

        voltarMenu();

    }catch(error){
        alert("Erro ao realizar login");
        console.error(error);
    }
}

async function cadastrar(){

    console.log("BOTÃO CADASTRAR CLICADO");

    const nome = document.getElementById("criar-nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("criar-senha").value;

    console.log(nome);
    console.log(email);
    console.log(senha);

    try{

        const resposta = await fetch(
            `http://127.0.0.1:8000/cadastro?nome=${nome}&email=${email}&senha=${senha}`,
            {
                method: "POST"
            }
        );

        const dados = await resposta.json();

        alert(dados.mensagem);

        inicio();

    }catch(error){
        alert("Erro ao cadastrar");
        console.error(error);
    }
}


function voltarMenu() {
    esconderPag();
    mostrar("menu-inicial");
}

async function verPerfil() {

    esconderPag();
    mostrar("ver-perfil");

    try{

        const resposta = await fetch(
            "http://127.0.0.1:8000/perfil",
            {
                headers:{
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await resposta.json();

        document.getElementById("recebeNome").textContent =
            dados.nome;

        document.getElementById("record").textContent =
            dados.pontuacao;

    }catch(error){
        console.error(error);
    }
}

async function adicionarPontos(valor){

    try{

        await fetch(
            `http://127.0.0.1:8000/pontuar?pontos=${valor}`,
            {
                method:"POST",
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );

    }catch(error){
        console.error(error);
    }
}

async function abrirRanking() {

    esconderPag();
    mostrar("ver-ranking");

    await carregarRanking();
}

async function carregarRanking(){

    try{

        const resposta = await fetch(
            "http://127.0.0.1:8000/ranking"
        );

        const ranking = await resposta.json();

        const tabela =
            document.getElementById("ranking-body");

        tabela.innerHTML = "";

        ranking.forEach(jogador => {

            let destaque = "";

            if(
                jogador.email?.toLowerCase() ===
                emailUsuario?.toLowerCase()
            ){
                destaque =
                    'id="minha-posicao"';
            }

            tabela.innerHTML += `
                <tr ${destaque}>
                    <td>${jogador.posicao}</td>
                    <td>${jogador.nome}</td>
                    <td>${jogador.pontuacao}</td>
                </tr>
            `;
        });

    }catch(error){
        console.error(error);
    }
}

function encontrarMinhaPosicao(){

    const linha =
        document.getElementById(
            "minha-posicao"
        );

    if(linha){

        linha.scrollIntoView({
            behavior:"smooth",
            block:"center"
        });

    }else{

        alert(
            "Você ainda não aparece no ranking."
        );
    }
}

async function sortearPalavra(){
    try{
        const resposta = await fetch("http://127.0.0.1:8000/sortear-palavra");

        const dados = await resposta.json();

        console.log(dados)

        palavra = dados.palavra;
        dica = dados.dica;
    }catch(error){
        console.error(error);
        alert("Erro ao carregar palavra")
    }
}

function novoJogo(){
    rodada = 1;
    ponto = 0;

    document.getElementById("ideia").parentElement.disabled = false;

    iniciarJogo()
}

async function iniciarJogo() {
    esconderPag();
    mostrar("iniciar-jogo");
    esconder("termo-correta");

    document.querySelectorAll(".tecla").forEach(function(tecla) {
        tecla.style.display = "block";
    });

    resetJogo();

    await carregarJogo();
}

function sair(){

    localStorage.removeItem("token");
    localStorage.removeItem("emailUsuario");

    token = null;
    emailUsuario = null;

    inicio();
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

    if(numeroErro === 11){
        encerrarJogo("Você perdeu")
    }else if(!exibicaoPalavra.includes("_")){
        encerrarJogo("Você acertou");
        setTimeout(()=>{
            console.log("passou 1.5 seg");
            let pontosGanhos = Math.max(0, 10 - (numeroErro * 2));
            ponto += pontosGanhos;

            adicionarPontos(pontosGanhos);
            rodada ++;    
            iniciarJogo();
        }, 1500);
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

function clicarTecla(letra) {
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

function resetJogo(){
    numeroErro = 0;

    esconder("termo-correta");

    document.getElementById("mensagem").innerHTML="";
    document.querySelectorAll(".botao-letra").forEach(botao => {
        botao.disabled = false;
    });
}
    
document.querySelectorAll(".botao-letra").forEach(botao => { 
    botao.addEventListener("click" , ()=> {
    let letra = botao.dataset.letra;
    verificarLetra(letra);
    })
})