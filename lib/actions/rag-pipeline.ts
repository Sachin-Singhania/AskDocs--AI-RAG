import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAI as GoogleGenAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { chromium } from "playwright";

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
    {"queries": "[],[],[]"}
    - Do NOT include any extra text, explanations, or greetings. Only output the JSON.
    - Length of the array must be 3 only 
    Example : - 
    User :- Explain photosynthesis in detail.
    Generated queries :- '{"queries": "["steps involved in photosynthesis process", "how plants makes food in breif","introduction to photosynthesis and stages"]"}'
    User :- I dont get it.
    Generated queries :- '{"queries": "["explain stepwise", "use b2 level english","give easy analogies"]"}'
    User : - how i make http server node plz code exampel i no get docs lang hard
     Generated queries :- '{"queries": "["node js http server code example", "building basic server in Node tutorial", "node js http server codes"]"}'
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
                { role: "system", parts: [{ text: query }] }
            ]
        });
        const final = response.text().trim();
        const queries: Array<string> = JSON.parse(final).queries;
        return queries;
    } catch (error) {
        console.error(error);
        return [];
    }
}
async function getSourcesFromQueries(queries: string, collectionName: string): Promise<{ data: any[]; error?: undefined; } | { data: never[]; error: any; }> {
    try {
        const ret = new QdrantVectorStore(embeddings, {
            url: 'http://localhost:6333', collectionName,
        })
        const fetch = await ret.similaritySearch(queries);
        const sources = fetch.map((doc) => doc.metadata.source);
        const filterunique = sources.filter((url, index, self) => self.indexOf(url) == index).slice(0, 3);
        return {
            data: filterunique
        };
    } catch (error: any) {
        return {
            data: [],
            error
        }
    }
}
async function getdatafromsources(sources: string[]): Promise<{ data: any[]; error?: undefined; } | { error: unknown; data?: never[]; }> {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        const context = [];
        for (let source of sources) {
            await page.goto(source, { waitUntil: "domcontentloaded" });
            const content = await page.$eval("body", (e: { innerText: any; }) => e.innerText);
            const cleanedText = content.replace(/\n+/g, ' ');
            context.push(cleanedText);
        }
        await browser.close();
        return {
            data: context,
        };
    } catch (error: unknown) {
        return {
            data: [],
            error: error
        };
    }
}
export async function ask(query: string, collectionName: string, messages: string[]) {
    try {
        const queries = await getQueries(query);
        let sources: any[] = [];
        let errorMessage;
        let context: any[] = [];
        if (queries.length <= 3 && queries.length != 0) {
            for (let i = 0; i < queries.length; i++) {
                let { data, error } = await getSourcesFromQueries(queries[i], collectionName);
                if (error) {
                    errorMessage = error;
                    break;
                }
                sources.push(data);
            }
            const finalsources = sources.filter((url, index, self) => self.indexOf(url) == index).slice(0, 3);
            const { data, error } = await getdatafromsources(finalsources);
            if (error && data?.length == 0) {
                errorMessage = error;
            }
            context.push(data);
        }

        //   const sources = await getSourcesFromQueries(query);

        const systemPrompt = `You are a helpful assistant that can answer questions from the provided context and give mid-long answers in structured way with emojies implementation and short analogies and remember to add sources in bulletpoint
          Context: ${context} Sources: ${sources} Error :${errorMessage}
          MESSAGES:- ${messages}
          
          Note: 1) If the query is not related to the context of the chat then respond your query is not related to the chat and dont give any answer
                2) if there is an error then respond user that there is an error and dont give any answer
                3) If there is no sources or context and error , but query is like explain again , i don't understand , whatever similar to this query then preview the old messages and take context from there 
          Example:
          Me- What is Html?
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
        console.log(final);
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