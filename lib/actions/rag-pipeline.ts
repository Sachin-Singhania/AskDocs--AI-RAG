"use server"
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAI as GoogleGenAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { chromium } from "playwright-core";
import { MESSAGESSENTTOAI } from "../types";
import { TYPE } from "../generated/prisma";

const ai = new GoogleGenAI(process.env.APIKEY as string);
const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: process.env.MODEL_NAME,
    apiKey: process.env.APIKEY,
})

async function getQueries(query: string): Promise<Array<string>> {
    try {
        const systemPrompt = `Given a query , form 3 more queries based on your understanding what the user is trying to ask . Try to make it less abstract 
    Please provide 3 more queries that are related to the original query 
    RULES:
    - Only output valid JSON in the following format:
    {"queries": [],[],[]}
    - Do NOT include any extra text, explanations, or greetings. Only output the JSON.
    - Length of the array must be 3 only 
    Example : - 
    User :- Explain photosynthesis in detail.
    Generated queries :- '{"queries": ["steps involved in photosynthesis process", "how plants makes food in breif","introduction to photosynthesis and stages"]}'
    User :- I dont get it.
    Generated queries :- '{"queries": ["explain stepwise", "use b2 level english","give easy analogies"]}'
    User : - how i make http server node plz code exampel i no get docs lang hard
     Generated queries :- '{"queries": ["node js http server code example", "building basic server in Node tutorial", "node js http server codes"]}'
    `
        const model = ai.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 1.5,
                responseMimeType: "application/json",
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }]
            },
        });
        const { response } = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: query }] }
            ]
        });
        const final = response.text().trim();
        console.log(final);
        const queries = JSON.parse(final).queries;
        return queries;
    } catch (error) {
        console.error(error);
        return [];
    }
}
async function getSourcesFromQueries(queries: string, collectionName: string,type:TYPE): Promise<{ sources: any[]; pageContents: any[]; error?: any }> {
    try {
        const ret = new QdrantVectorStore(embeddings, {
            url: 'http://localhost:6333', collectionName,
        })
        const fetch = await ret.similaritySearch(queries);
          let sources: any[] = [];
    let pageContents: any[] = [];
     if (type === "URL") {
      sources = fetch
        .map((doc) => doc.metadata.source)
        .filter((url, index, self) => self.indexOf(url) === index)
        .slice(0, 3);

      pageContents = fetch
        .map((doc) => doc.pageContent)
        .filter((content, index, self) => self.indexOf(content) === index)
        .slice(0, 3);
    } else {
      // PDF type — only pageContents
      pageContents = fetch
        .map((doc) => doc.pageContent)
        .filter((content, index, self) => self.indexOf(content) === index)
        .slice(0, 3);
    }
       return {
      sources,
      pageContents,
    };

  } catch (error: any) {
    return {
      sources: [],
      pageContents: [],
      error,
    };
  }
}
// async function getdatafromsources(sources: string[]): Promise<{ data: any[]; error?: undefined; } | { error: unknown; data?: never[]; }> {
//     try {
//         const browser = await chromium.launch({headless: true});
//         const page = await browser.newPage();
//         const context = [];
//         for (let source of sources) {
//             await page.goto(source, { waitUntil: "domcontentloaded" });
//             const content = await page.$eval("body", (e: { innerText: any; }) => e.innerText);
//             const cleanedText = content.replace(/\n+/g, ' ');
//             context.push(cleanedText);
//         }
//         await browser.close();
//         return {
//             data: context,
//         };
//     } catch (error: unknown) {
//         return {
//             data: [],
//             error: error
//         };
//     }
// }

export async function ask(query: string, collectionName: string, messages: MESSAGESSENTTOAI[],type:TYPE) {
    try {
        const queries = await getQueries(query);
        let sources: any[] = [];
        let errorMessage;
        let context: any[] = [];
        let SummarizeMsg;
        if(messages.length>4){
             SummarizeMsg= await SummarizeChat(messages);
        }
        if (queries.length > 0 && queries.length <= 3) {
            // if (type === "URL") {
                for (const q of queries) {
                const { pageContents:data_p,sources:data_s, error } = await getSourcesFromQueries(q, collectionName, type);
                if (error) {
                    errorMessage = error;
                    break;
                }
                sources.push(...data_s);
                context.push(...data_p);
                }

                sources = sources.filter((url, index, self) => self.indexOf(url) === index).slice(0, 3);
                context = context.filter((contenxt,index,self)=> self.indexOf(contenxt)===index).slice(0,3);
                // const { data, error } = await getdatafromsources(sources);
                // if (error || !data || data.length === 0) {
                // errorMessage = error;
                // } else {
                // context.push(...data);
                // }

            // } else if (type === "PDF") {
            //     sources = []; 
            //     for (const q of queries) {
            //     const { data, error } = await getSourcesFromQueries(q, collectionName, type);
            //     if (error) {
            //         errorMessage = error;
            //         break;
            //     }
            //     context.push(...data);
            //     }
            // }
            }
            let promptParts: string[] = [];
            if (context && context.length>0){
                  promptParts.push(`- CONTEXT: ${JSON.stringify(context)}`);
            }if (sources && sources.length > 0) {
                promptParts.push(`- SOURCES: ${JSON.stringify(sources)}`);
            }
            if (errorMessage) {
                promptParts.push(`- ERROR: ${errorMessage}`);
             }
             if(messages.length<=4){
                 promptParts.push(`- SUMMARIZED MESSAGES : ${JSON.stringify(messages)}`);
             }else{
                 promptParts.push(`- SUMMARIZED MESSAGES : ${JSON.stringify(SummarizeMsg)}`);
             }
        //   const sources = await getSourcesFromQueries(query);
        const systemPrompt = `You are a helpful assistant that can answer questions from the provided context and give mid-long answers in structured way with emojies implementation and short analogies and remember to add sources in bulletpoint
          Available inputs:
         ${promptParts.join("\n")}

         INSTRUCTIONS:
         1.The user's query may contain minor spelling mistakes or typos. If these can be reasonably matched to the CONTEXT, answer as normal.
         2. If there is an **ERROR**, politely tell the user:
           "Something went wrong. Please try again later." Do not answer the query.
         3. If **CONTEXT is empty** and **there's no ERROR**, but the query is something like:
            - "I don't understand"
            - "Explain again"
            - "Repeat"
            - "Summarize"
            - "In short"
            - "Give chat summary"
            → Then use the MESSAGES array to generate your response 
        4. If the user explicitly asks for a **summary of the conversation**, summarize the MESSAGES array instead of using CONTEXT.
        Answer clearly in human-like tone. Respond only if the context or message history makes the query valid.
          Example:
          Me- What is httml?
          You- HTML stands for HyperText Markup Language. It's basically the building blocks of any website. It tells your browser how to display things like text, images, headings, and links on a webpage. You don’t need to be an expert to start building websites. Learning the basics—like how to create a page layout, add text, images, and links—can be done in a weekend. Once you get those down, you’re good to go.
              HTML5 is the latest version of HTML. It brings new features and improvements, including:
              New semantic elements: <header>, <footer>, <section>, <article>
              Built-in support for audio, video, and graphics:
              <audio>, <video>, <canvas>
              Improved form controls: <input type="date">, <input type="range">
              🧪 HTML5 Example:
              html
              Copy
              Edit
              <article>
                <header>
                  <h2>Learning HTML5</h2>
                </header>
                <p>HTML5 makes web development simpler and more powerful.</p>
                <video controls>
                  <source src="demo.mp4" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </article>
              📘 How Much HTML Do You Need to Learn?
              You only need the basics to get started. Focus on these key elements:
              Structure: <html>, <head>, <body>
              Content: <h1> to <h6>, <p>, <a>, <img>
              Lists: <ul>, <ol>, <li>
              Forms: <form>, <input>, <button>
              With just these, you can create your first real web page!
              
              Sources: 
                - https://chaidocs.vercel.app/youtube/chai-aur-html/introduction/
                - https://chaidocs.vercel.app/youtube/chai-aur-html/html-tags/
          `
        const model = ai.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 1.5,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }],
            }
        });
        const { response } = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: query }] }],
        });
        const final = response.text().trim();
        return final;
    } catch (error: any) {
        return `Error: ${error.message}`;
    }
}


export async function CreateTopic(URLorPDFname: string) {
    const query = `Create a chat topic for given url or pdf name 
    Note:- use good and nice words and not same repetive from examples
    RULES:
    - Only output valid JSON in the following format:
    {"topic": "<topic-name>"}
    - Do NOT include any extra text, explanations, or greetings. Only output the JSON.
    for Example:-
     USER:-https://threejs.org/docs/
     YOU:- '{"topic":"Threejs tutorial"}'
     USER: - Nodejs.pdf
     YOU:- '{"topic":"Learning Nodejs"}'
    `;
    const model = ai.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 1.5,
            responseMimeType: "application/json",
        }, systemInstruction: {
            role: "system",
            parts: [{ text: query }]
        }
    });
    const { response } = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: URLorPDFname }] }],
    });
    const final = response.text().trim();
    const json = JSON.parse(final);
    console.log(json.topic);
    return json.topic;
}

async function SummarizeChat(messages:MESSAGESSENTTOAI[]) {
    try {
        const lastThreeMsg= messages.slice(messages.length-4,messages.length-1);
        console.log(lastThreeMsg);
        const query = `You are an Ai Chat Summarizer, You will summarize the chat message from the given messages
        MESSAGES:-
        ${lastThreeMsg.map((m, i) => `(${i + 1}) [${m.role}] ${m.content}`).join('\n')}
        `
         const model = ai.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 1.5,
            },
            systemInstruction: {
                    role: "system",
            parts: [{ text: query }]
            }
        });
        const { response } = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: query }] }],
        });
        const final = response.text().trim();
        return final;
    } catch (error) {
        
    }
    
}