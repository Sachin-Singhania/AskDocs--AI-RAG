"use server"
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAI as GoogleGenAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MESSAGESSENTTOAI, MESSAGESSENTTOAI_WITHSUMMARY } from "../types";
import { QdrantClient } from "@qdrant/js-client-rest";
import { rate_limit_action_function } from "./api";
import { systemPrompt } from "../systemprompt";
import { TYPE } from "@prisma/client";


class GEMINI_ERROR extends Error{
    constructor(message: string) {
    super(message);
    this.name = "GEMINI_ERROR";
  }
}

const client = new QdrantClient({ url: process.env.QDRANT_URL ,apiKey: process.env.QDRANT_API_KEY});
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
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
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
async function ensureCollectionExistsThenConnect(collectionName: string): Promise<QdrantVectorStore> {
  // Check if the collection exists
  try {
    await client.getCollection(collectionName);
  } catch (err) {
    console.error(`Collection ${collectionName} does not exist.`, err);
    throw new Error(`Collection "${collectionName}" does not exist. Aborting.`);
  }

  // Now safe to connect without creating
  return new QdrantVectorStore(embeddings, {
    client,
    collectionName
  });
}
async function getSourcesFromQueries(queries: string, collectionName: string,type:TYPE): Promise<{ sources: any[]; pageContents: any[]; error?: any }> {
    try {
        const ret = await ensureCollectionExistsThenConnect(collectionName);
       
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
    console.log(pageContents)
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


export async function ask(query: string, collectionName: string, messages: MESSAGESSENTTOAI[],type:TYPE,chatId:string) {
    try {
        rate_limit_action_function();
        const queries = await getQueries(query);
        let sources: any[] = [];
        let errorMessage;
        let context: any[] = [];
        let SummarizeMsg: MESSAGESSENTTOAI_WITHSUMMARY | null = null;
        if(messages.length>5){
             let messageFromApi= await SummarizeChat(messages,chatId);
             let lastThreeMessages = messages.slice(-3);
             if(messageFromApi.status) {
                 SummarizeMsg = {
                     ChatSummary: messageFromApi.message ?? "",
                       messages: lastThreeMessages
               }
                }else{
                    SummarizeMsg = {
                        messages : lastThreeMessages
                    }
                }
        }
        const { pageContents:data_p,sources:data_s, error } = await getSourcesFromQueries(query,collectionName,type);
        if (error) {
            errorMessage = error;
        }else{
            sources.push(...data_s);
            context.push(...data_p);
        }
        if (queries.length > 0 && queries.length <= 3) {
                for (const q of queries) {
                const { pageContents:data_p,sources:data_s, error } = await getSourcesFromQueries(q, collectionName, type);
                if (error) {
                    errorMessage = error;
                    break;
                }
                sources.push(...data_s);
                context.push(...data_p);
                }
                //original query 

                sources = sources.filter((url, index, self) => self.indexOf(url) === index).slice(0, 3);
                context = context.filter((contenxt,index,self)=> self.indexOf(contenxt)===index).slice(0,3);
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
             if(messages.length<6){
                 promptParts.push(`- SUMMARIZED MESSAGES : ${JSON.stringify(messages)}`);
             }else{
                 promptParts.push(`- SUMMARIZED MESSAGES : ${JSON.stringify(SummarizeMsg)}`);
             }

        const system_prompt= systemPrompt(promptParts);

        const model = ai.getGenerativeModel({
            model: "gemini-2.5-pro",
            generationConfig: {
                temperature: 0.7,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: system_prompt }],
            }
        });
        const { response } = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: query }] }],
        });
        const final = response.text().trim();
        return {
            message : final,
            status : true
        };
    } catch (error: any) {
        console.error(error);
        throw new GEMINI_ERROR("THERE WAS SOME ERROR WHILE PROCESSING MESSAGE")
    }
}


export async function CreateTopic(URLorPDFname: string) {
    try {
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
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
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
        return json.topic;
    } catch (error) {
        console.log(error)
        throw new GEMINI_ERROR("THERE WAS SOME ERROR WHILE CALLING GEMINI");
    }
}

async function SummarizeChat(messages:MESSAGESSENTTOAI[],chatId:string) {
    try {
        const length=messages.length;
        const local_storage= localStorage.getItem('Summarized-Chat') ?? "{}";
        const PreviousSummarizedChat:{
            [key:string]: string
        }= JSON.parse(local_storage);
        const currChatIdSummarized= PreviousSummarizedChat[chatId] ? PreviousSummarizedChat[chatId] : null;

        if(length>=6 && currChatIdSummarized==null){
            let remaining_chat_length= length-4;
            let no_of_chats= remaining_chat_length>=6 ? 6 : remaining_chat_length;
            let chats= messages.slice(remaining_chat_length-no_of_chats,remaining_chat_length);
            const query = `You are an Ai Chat Summarizer, You will summarize the chat message from the given messages
            MESSAGES:-
            ${chats.map((m, i) => `(${i + 1}) [${m.role}] ${m.content}`).join('\n')}
            `
         const model = ai.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                temperature: 0.7,
            },
        });
        const { response } = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: query }] }],
        });
        const final = response.text().trim();
        return {
            status : true,
            message : final
        };
        }


        const message= messages[length-5].content;
        const query = `You are an Ai Chat Summarizer, You will summarize the chat message with given previous messages that was summarized from the given messages
         INSTRUCTION :
         - Highlight important things if user has asked bunch of question previously then summarized must also contain those question, so that you stay aware of the main context
         - If current Message is related to error or something that has gone wrong from your analysis then don't give that importance to that message and return summarized as it is
         - Analyze messages , try to understand the message intent 
         AVAILABLE INPUTS:-
         - PREVIOUS SUMMARIZED MESSAGE: - ${PreviousSummarizedChat}
        
         Example:- 
           Me : PREVIOUS SUMMARIZED MESSAGE :- We talked about intrusion detection system then its types along with intrusion prevention system along with its types. User didn't understood so we explaine again 
                Current Message :- I am sorry, I cannot provide an answer regarding local storage in Next.js as it is not covered in the given context.
           You : We talked about intrusion detection system then its types along with intrusion prevention system along with its types. User didn't understood so we explaine again 
          
           Me : PREVIOUS SUMMARIZED MESSAGE :- We talked about intrusion detection system then its types along with intrusion prevention system along with its types. User didn't understood so we explaine again 
                Current Message :- I am unable to generate a response at this time due to an error.
           You : We talked about intrusion detection system then its types along with intrusion prevention system along with its types. User didn't understood so we explaine again 
           
           Me : PREVIOUS SUMMARIZED MESSAGE :- We talked about intrusion detection system then its types along with intrusion prevention system along with its types. User didn't understood so we explain again 
                 Current Message :- Give answer to all these questions 
                 1) What is ids used for?
                 2) what is advantage of ips over ids?
                 3) what is differnce between ids and ips?
                
           You : We talked about IDS and IPS earlier, Now user has provided us with some questions 1) ids uses? 2) advantage of ips over ids? 3) difference between ids and ips?  

           Me: PREVIOUS SUMMARIZED MESSAGE :-We talked about IDS and IPS earlier, Now user has provided us with some questions 1) ids uses? 2) advantage of ips over ids? 3) difference between ids and ips?  
                Current Message :- okay next

           You : We talked about IDS and IPS earlier then user provided with questions and my analysis user understood 1st question which was Intrusion detection system uses so here are the remaning question 2) advantage of ips over ids 3) difference between ids and ips
           `
         const model = ai.getGenerativeModel({
            model: "gemini-2.5-pro",
            generationConfig: {
                temperature: 0.7,
            },
            systemInstruction: {
                    role: "system",
            parts: [{ text: query }]
            }
        });
        const { response } = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: message }] }],
        });
        const final = response.text().trim();
        return {
            status : true,
            message : final
        };
    } catch (error) {
        return {
            status: false,
            message : "Error occurred"
        }
    }
    
}