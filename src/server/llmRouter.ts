import crypto from 'crypto';
import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Simple symmetric encryption helper
function getEncryptionKeyStr(): string {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('ENCRYPTION_KEY environment variable is required.');
  }
  return keyStr;
}

export function encrypt(text: string): string {
  const key = crypto.createHash('sha256').update(getEncryptionKeyStr()).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const key = crypto.createHash('sha256').update(getEncryptionKeyStr()).digest();
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted format. Must be iv:encryptedText");
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export interface AIConfig {
  provider: 'google' | 'openai' | 'anthropic';
  apiKey: string;
  modelName?: string;
}

export async function getTenantAIConfig(tenantId: string): Promise<AIConfig | null> {
  if (!tenantId) return null;
  try {
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);
    const doc = await db.collection('tenants').doc(tenantId).collection('secrets').doc('ai_config').get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data || !data.provider || !data.encryptedApiKey) return null;
    
    const apiKey = decrypt(data.encryptedApiKey);
    return {
      provider: data.provider as 'google' | 'openai' | 'anthropic',
      apiKey,
      modelName: data.modelName
    };
  } catch (err) {
    console.error(`Error loading BYOK AI Config for tenant ${tenantId}:`, err);
    return null;
  }
}

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  modelOverride?: string;
}

export async function routeGenerateContent(
  tenantId: string | undefined,
  options: GenerateOptions
): Promise<string> {
  const config = tenantId ? await getTenantAIConfig(tenantId) : null;
  
  if (!config) {
    // Fall back to system Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("No API key configured for Gemini system");
    }
    const ai = new GoogleGenAI({ apiKey });
    const model = options.modelOverride || "gemini-3.5-flash";
    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: options.responseMimeType as any,
        responseSchema: options.responseSchema,
      },
    });
    return response.text || '';
  }

  const { provider, apiKey, modelName } = config;

  if (provider === 'google') {
    const ai = new GoogleGenAI({ apiKey });
    const model = options.modelOverride || modelName || "gemini-3.5-flash";
    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: options.responseMimeType as any,
        responseSchema: options.responseSchema,
      },
    });
    return response.text || '';
  }

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey });
    const model = options.modelOverride || modelName || "gpt-4o";
    const messages: any[] = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    
    let promptWithSchema = options.prompt;
    if (options.responseMimeType === 'application/json' && options.responseSchema) {
      promptWithSchema += `\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching this schema:\n${JSON.stringify(options.responseSchema, null, 2)}`;
    }

    messages.push({ role: "user", content: promptWithSchema });

    const response = await openai.chat.completions.create({
      model,
      messages,
      response_format: options.responseMimeType === 'application/json' ? { type: "json_object" } : undefined,
    });
    return response.choices[0]?.message?.content || '';
  }

  if (provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey });
    const model = options.modelOverride || modelName || "claude-3-5-sonnet-latest";
    const messages: any[] = [];
    
    let promptWithSchema = options.prompt;
    if (options.responseMimeType === 'application/json' && options.responseSchema) {
      promptWithSchema += `\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching this schema:\n${JSON.stringify(options.responseSchema, null, 2)}\nDo not wrap the response in markdown blocks or backticks. Return raw JSON.`;
    }

    messages.push({ role: "user", content: promptWithSchema });

    const response = await anthropic.messages.create({
      model,
      system: options.systemInstruction,
      messages,
      max_tokens: 4096,
    });
    
    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  text: string;
}

export interface ChatOptions {
  history: ChatMessage[];
  message: string;
  systemInstruction?: string;
}

export async function routeChat(
  tenantId: string | undefined,
  options: ChatOptions
): Promise<string> {
  const config = tenantId ? await getTenantAIConfig(tenantId) : null;

  if (!config) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("No API key configured for Gemini system");
    }
    const ai = new GoogleGenAI({ apiKey });
    const formattedHistory = (options.history || []).map(h => ({
      role: h.role === 'assistant' ? 'model' : h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history: formattedHistory as any,
      config: {
        systemInstruction: options.systemInstruction,
      }
    });

    const response = await chat.sendMessage({ message: options.message });
    return response.text || '';
  }

  const { provider, apiKey, modelName } = config;

  if (provider === 'google') {
    const ai = new GoogleGenAI({ apiKey });
    const formattedHistory = (options.history || []).map(h => ({
      role: h.role === 'assistant' ? 'model' : h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: modelName || "gemini-3.5-flash",
      history: formattedHistory as any,
      config: {
        systemInstruction: options.systemInstruction,
      }
    });

    const response = await chat.sendMessage({ message: options.message });
    return response.text || '';
  }

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey });
    const model = modelName || "gpt-4o";
    const messages: any[] = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }

    for (const h of options.history) {
      const role = h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user';
      messages.push({ role, content: h.text });
    }

    messages.push({ role: "user", content: options.message });

    const response = await openai.chat.completions.create({
      model,
      messages,
    });
    return response.choices[0]?.message?.content || '';
  }

  if (provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey });
    const model = modelName || "claude-3-5-sonnet-latest";
    const messages: any[] = [];

    for (const h of options.history) {
      const role = h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user';
      messages.push({ role, content: h.text });
    }

    messages.push({ role: "user", content: options.message });

    const response = await anthropic.messages.create({
      model,
      system: options.systemInstruction,
      messages,
      max_tokens: 4096,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

// Minimal, low-cost call per provider used to validate that a key is accepted.
export async function testAIConfig(config: AIConfig): Promise<void> {
  const { provider, apiKey, modelName } = config;

  if (provider === 'google') {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.countTokens({ model: modelName || "gemini-3.5-flash", contents: "test" });
    return;
  }

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey });
    await openai.models.list();
    return;
  }

  if (provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey });
    await anthropic.models.list();
    return;
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

export async function getGoogleAIInstance(tenantId: string | undefined): Promise<GoogleGenAI> {
  const config = tenantId ? await getTenantAIConfig(tenantId) : null;
  if (config && config.provider === 'google') {
    return new GoogleGenAI({ apiKey: config.apiKey });
  }
  const systemKey = process.env.GEMINI_API_KEY;
  if (!systemKey) {
    throw new Error("No API key configured for Gemini system");
  }
  return new GoogleGenAI({ apiKey: systemKey });
}
