import os
import io

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel
from pypdf import PdfReader


# 读取 .env 文件
load_dotenv()

api_key = os.getenv("DEEPSEEK_API_KEY")


# 创建网站后端
app = FastAPI(title="CQU ResearchBuddy")


# 让后端可以读取 static 文件夹
app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


# 首页
@app.get("/")
def home():
    return FileResponse("static/index.html")


# 接收网页传来的数据
class AskRequest(BaseModel):
    mode: str
    content: str


# 三种 AI 功能
PROMPTS = {

    "paper": """
你是一个面向本科科研新人的论文理解助手。

请根据用户提供的论文摘要或论文片段进行分析。

请按照以下格式回答：

【研究背景】
【研究问题】
【主要方法】
【主要结果】
【创新点】
【局限】
【新手需要理解的概念】
【一句话总结】

要求：
1. 使用简单、清晰的中文；
2. 不要编造用户没有提供的信息；
3. 如果材料不足，请明确说明无法判断。
""",

    "plan": """
你是一个本科科研规划助手。

请根据用户提供的年级、专业、科研方向、
当前基础和目标，制定一个现实、简单、
适合科研新手的学习计划。

按照以下格式回答：

【当前情况分析】
【近期目标】
【第一阶段】
【第二阶段】
【第三阶段】
【重点学习内容】
【下一步最应该做的三件事】

要求：
1. 不要设置过高要求；
2. 计划必须具体；
3. 适合科研新手执行。
""",

    "record": """
你是一个科研记录整理助手。

请将用户输入的零散科研或实验内容整理成：

【实验/科研任务】
【实验目的】
【已完成内容】
【观察结果】
【异常情况】
【可能需要检查的问题】
【下一步计划】

要求：
1. 不允许编造用户没有提供的数据；
2. 事实和推测要区分；
3. 缺失信息直接写“未提供”。
"""
}


@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="请上传 PDF 文件"
        )

    try:
        content = await file.read()

        reader = PdfReader(
            io.BytesIO(content)
        )

        text_list = []

        for page in reader.pages:
            text = page.extract_text()

            if text:
                text_list.append(text)

        full_text = "\n\n".join(text_list)

        if not full_text.strip():
            raise HTTPException(
                status_code=400,
                detail="无法从这个 PDF 中提取文字"
            )

        # 第一版控制长度，防止论文过长、API消耗过大
        max_chars = 25000

        if len(full_text) > max_chars:
            full_text = (
                full_text[:max_chars]
                + "\n\n【提示：论文较长，目前仅提取前部分内容】"
            )

        return {
            "filename": file.filename,
            "text": full_text
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF解析失败：{str(e)}"
        )
@app.post("/api/ask")
def ask_ai(request: AskRequest):

    if request.mode not in PROMPTS:
        raise HTTPException(
            status_code=400,
            detail="未知功能模式"
        )

    if not request.content.strip():
        raise HTTPException(
            status_code=400,
            detail="请输入内容"
        )

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="没有配置 DeepSeek API Key"
        )

    try:

        client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com"
        )

        response = client.chat.completions.create(
            model="deepseek-flash",
            messages=[
                {
                    "role": "system",
                    "content": PROMPTS[request.mode]
                },
                {
                    "role": "user",
                    "content": request.content
                }
            ]
        )

        return {
            "answer":
                response.choices[0].message.content
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"AI调用失败：{str(e)}"
        )