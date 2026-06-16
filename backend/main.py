from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
import pymysql

def conectar():
    return pymysql.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="Maranhaolaranja1@",
        database="palavra"
    )

SECRET_KEY = "minha-chave-secreta"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials = True,
    allow_methods=['*'],
    allow_headers=['*'],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def buscar_usuario(email):
    conexao = conectar()
    cursor = conexao.cursor(pymysql.cursors.DictCursor)

    cursor.execute(
        "SELECT * FROM usuario WHERE email = %s", (email,)
    )

    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()
    return usuario

def verificar_senha(senha_digitada, senha_hash):
    return pwd_context.verify(senha_digitada, senha_hash)

def autenticar_usuario(email, senha):
    usuario = buscar_usuario(email)

    if not usuario:
        return None

    if not verificar_senha(senha, usuario["senha_hash"]):
        return None

    return usuario

def criar_token_acesso(data: dict, expires_delta: Optional[timedelta] = None):
    dados = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    dados.update({"exp": expire})

    token = jwt.encode(dados, SECRET_KEY, algorithm=ALGORITHM)

    return token


def obter_usuario_logado(token: str = Depends(oauth2_scheme)):
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")

        if email is None:
            raise credenciais_exception

    except JWTError:
        raise credenciais_exception

    usuario = buscar_usuario(email)

    if usuario is None:
        raise credenciais_exception

    return usuario



@app.get("/sortear-palavra")
def sortear_palavra():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("SELECT palavra, dica FROM termo ORDER BY RAND() LIMIT 1")
    palavra, dica = cursor.fetchone()

    cursor.close()
    conexao.close()

    return {
        "palavra": palavra,
        "dica": dica
    }

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    usuario = autenticar_usuario(form_data.username, form_data.password)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos",
        )

    token = criar_token_acesso(
        data={
            "sub": usuario["email"],
            "perfil": usuario["perfil"],
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "nome": usuario["nome"],
            "email": usuario["email"],
            "perfil": usuario["perfil"],
        },
    }

@app.post("/cadastro")
def cadastro(nome: str, email: str, senha: str):
    usuario_existente = buscar_usuario(email)

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="E-mail já cadastrado"
        )

    conexao = conectar()
    cursor = conexao.cursor()

    senha_hash = pwd_context.hash(senha)

    cursor.execute(
        """
        INSERT INTO usuario
        (nome,email,senha_hash,perfil,pontuacao)
        VALUES (%s,%s,%s,%s,%s)
        """,
        (nome,email,senha_hash,"user",0)
    )

    conexao.commit()

    cursor.close()
    conexao.close()

    return {"mensagem": "Usuário cadastrado"}

@app.get("/perfil")
def perfil(usuario=Depends(obter_usuario_logado)):

    return {
        "nome": usuario["nome"],
        "email": usuario["email"],
        "pontuacao": usuario["pontuacao"],
        "perfil": usuario["perfil"]
    }

@app.post("/pontuar")
def pontuar(
    pontos: int,
    usuario=Depends(obter_usuario_logado)
):

    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE usuario
        SET pontuacao = pontuacao + %s
        WHERE id = %s
        """,
        (pontos, usuario["id"])
    )

    conexao.commit()

    cursor.close()
    conexao.close()

    return {"mensagem": "Pontuação atualizada"}

@app.get("/ranking")
def ranking():

    conexao = conectar()

    cursor = conexao.cursor(
        pymysql.cursors.DictCursor
    )

    cursor.execute("""
        SELECT nome, email, pontuacao
        FROM usuario
        ORDER BY pontuacao DESC
    """)

    dados = cursor.fetchall()

    ranking = []

    for posicao, jogador in enumerate(dados, start=1):
        ranking.append({
            "posicao": posicao,
            "nome": jogador["nome"],
            "pontuacao": jogador["pontuacao"]
        })

    cursor.close()
    conexao.close()

    return ranking