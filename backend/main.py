from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pymysql

conexao = pymysql.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="Maranhaolaranja1@",
        database="palavra"
    )

cursor = conexao.cursor()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials = True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get("/sortear-palavra")
def sortear_palavra():
    sql = "SELECT palavra, dica FROM termo ORDER BY RAND() LIMIT 1"

    cursor.execute(sql)
    palavra, dica = cursor.fetchone()
    return {
        "palavra": palavra,
        "dica": dica
    }
   
