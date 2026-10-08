let currentMode = "paper";


const pdfArea =
    document.getElementById("pdf-area");

const pdfInput =
    document.getElementById("pdf-input");

const pdfButton =
    document.getElementById("pdf-btn");

const pdfName =
    document.getElementById("pdf-name");
const buttons =
    document.querySelectorAll(".mode");

const title =
    document.getElementById("title");

const description =
    document.getElementById("description");

const input =
    document.getElementById("input");

const submit =
    document.getElementById("submit");

const exampleButton =
    document.getElementById("example-btn");

const clearButton =
    document.getElementById("clear-btn");

const copyButton =
    document.getElementById("copy-btn");

const resultCard =
    document.getElementById("result-card");

const result =
    document.getElementById("result");

const loading =
    document.getElementById("loading");



const config = {

    paper: {

        title:
            "论文理解",

        description:
            "粘贴论文摘要或论文片段，AI 帮你提取研究背景、方法、结果和创新点。",

        placeholder:
            "请粘贴论文摘要或需要理解的论文内容……",

        example:
`马铃薯晚疫病是由致病疫霉引起的重要植物病害。

本研究筛选了一个可能参与马铃薯抗病反应的候选转录因子，
通过基因表达分析和瞬时表达实验，
研究其在病原侵染过程中的潜在功能。

实验结果表明，该基因在致病疫霉侵染后表达水平发生明显变化，
提示其可能参与马铃薯对晚疫病的抗性调控。`

    },


    plan: {

        title:
            "科研规划",

        description:
            "告诉 AI 你的年级、专业、当前基础和研究目标，生成适合你的科研入门计划。",

        placeholder:
`例如：

年级：大一
专业：工科试验班
研究兴趣：人工智能、生物医学
当前基础：Python刚入门
目前项目：正在参加SRTP
目标：未来希望向AI与生物医学交叉方向发展`,

        example:
`年级：大一

专业：工科试验班（医工交叉与环化健康）

当前基础：
刚进入大学，
Python基础较弱，
以前没有系统科研经历。

目前正在参加：
马铃薯晚疫病抗性基因研究SRTP。

研究兴趣：
人工智能和生物医学交叉方向。

目标：
希望逐步学习科研方法和AI基础，
未来尝试医学AI、生物信息学等方向。

请为我制定一个适合未来一个月的科研学习计划。`

    },


    record: {

        title:
            "实验记录整理",

        description:
            "输入今天完成的科研或实验内容，AI 帮你整理成规范记录。",

        placeholder:
`例如：

今天学习了PCR实验。
跟着师兄了解了实验流程。
目前还没有独立操作。
对引物设计还有一些不理解。`,

        example:
`今天下午进入实验室，
主要学习PCR实验的基本原理和实验流程。

师兄介绍了PCR扩增的基本步骤，
并演示了部分实验操作。

今天主要以观察和学习为主，
还没有独立进行PCR实验。

目前对引物设计以及PCR反应体系的组成还不太理解。

准备之后继续查阅资料，
并向师兄确认相关问题。`

    }

};



// ==========================
// 切换功能
// ==========================

buttons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            currentMode =
                this.dataset.mode;


            buttons.forEach(btn => {

                btn.classList.remove(
                    "active"
                );

            });


            this.classList.add(
                "active"
            );


            const current =
                config[currentMode];


            title.textContent =
                current.title;


            description.textContent =
                current.description;


            input.placeholder =
                current.placeholder;


            input.value = "";


            result.textContent = "";


            resultCard.classList.add(
                "hidden"
            );

        }
    );

});



// ==========================
// 示例输入
// ==========================

exampleButton.addEventListener(
    "click",
    function () {

        input.value =
            config[currentMode].example;

        input.focus();

    }
);



// ==========================
// 清空
// ==========================

clearButton.addEventListener(
    "click",
    function () {

        input.value = "";

        result.textContent = "";

        resultCard.classList.add(
            "hidden"
        );

        input.focus();

    }
);



// ==========================
// 复制结果
// ==========================

copyButton.addEventListener(
    "click",
    async function () {

        const text =
            result.textContent.trim();


        if (!text) {

            alert(
                "当前还没有可以复制的内容。"
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(
                text
            );


            copyButton.textContent =
                "✅ 已复制";


            setTimeout(
                function () {

                    copyButton.textContent =
                        "📋 复制结果";

                },
                1500
            );


        } catch (error) {

            alert(
                "复制失败，请手动复制。"
            );

        }

    }
);



// ==========================
// PDF 上传
// ==========================

pdfButton.addEventListener(
    "click",
    function () {

        pdfInput.click();

    }
);


pdfInput.addEventListener(
    "change",
    async function () {

        const file =
            pdfInput.files[0];


        if (!file) {
            return;
        }


        // 显示文件名
        pdfName.textContent =
            file.name;


        // 按钮变成加载状态
        pdfButton.disabled = true;

        pdfButton.textContent =
            "正在读取 PDF……";


        // 创建文件上传数据
        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        try {

            // 上传到 FastAPI
            const response =
                await fetch(
                    "/api/upload-pdf",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "PDF读取失败"
                );

            }


            // 把 PDF 文字自动放入输入框
            input.value =
                data.text;


            // 显示成功
            pdfButton.textContent =
                "✅ PDF 已读取";


            // 如果论文太长
            if (data.truncated) {

                pdfName.textContent =
                    file.name +
                    "（论文较长，当前读取前部分内容）";

            } else {

                pdfName.textContent =
                    file.name +
                    `（${data.pages} 页）`;

            }


        } catch (error) {

            alert(
                "PDF读取失败："
                + error.message
            );


            pdfButton.textContent =
                "📎 上传 PDF 论文";


        } finally {

            pdfButton.disabled =
                false;

        }

    }
);
// ==========================
// 调用 AI
// ==========================

submit.addEventListener(
    "click",
    async function () {

        const content =
            input.value.trim();


        if (!content) {

            alert(
                "请先输入内容。"
            );

            return;

        }


        resultCard.classList.remove(
            "hidden"
        );


        loading.classList.remove(
            "hidden"
        );


        result.textContent = "";


        submit.disabled = true;


        submit.textContent =
            "AI 正在分析……";


        try {

            const response =
                await fetch(
                    "/api/ask",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                {

                                    mode:
                                        currentMode,

                                    content:
                                        content

                                }
                            )

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "AI 服务暂时不可用"
                );

            }


            result.textContent =
                data.answer;


        } catch (error) {

            console.error(error);


            result.textContent =
`AI 服务暂时出现问题。

请稍后重新尝试。

如果问题持续存在，请检查网络连接或 AI 服务状态。`;


        } finally {

            loading.classList.add(
                "hidden"
            );


            submit.disabled =
                false;


            submit.textContent =
                "开始分析";

        }

    }
);