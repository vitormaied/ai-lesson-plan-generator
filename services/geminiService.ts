
import { GoogleGenAI, Type } from "@google/genai";
import type { LessonPlan, LessonPlanInput } from '../types';

const getAiClient = (apiKey: string) => {
    return new GoogleGenAI({ apiKey });
};

const lessonPlanSchema = {
  type: Type.OBJECT,
  properties: {
    bnccSkills: {
      type: Type.ARRAY,
      description: "Liste 2-3 códigos e descrições de habilidades da BNCC relevantes para o nível de ensino e conteúdo.",
      items: { type: Type.STRING }
    },
    objectives: {
      type: Type.ARRAY,
      description: "Liste 3-4 objetivos de aprendizagem claros e mensuráveis, adequados para a turma.",
      items: { type: Type.STRING }
    },
    methodology: {
      type: Type.STRING,
      description: "Descreva uma metodologia de ensino detalhada (ex: aula expositiva, debate, atividades em grupo). Dê sugestões práticas de como conduzir a aula, considerando o nível de ensino."
    },
    resources: {
      type: Type.ARRAY,
      description: "Liste os recursos e materiais didáticos necessários.",
      items: { type: Type.STRING }
    },
    assessment: {
      type: Type.ARRAY,
      description: "Sugira 2-3 métodos de avaliação formativa ou somativa, apropriados para a turma.",
      items: { type: Type.STRING }
    }
  },
  required: ["bnccSkills", "objectives", "methodology", "resources", "assessment"]
};

const handleApiCall = async (apiKey: string, prompt: string, responseSchema: object) => {
    try {
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("A resposta da IA está vazia.");
        }
        return JSON.parse(text);

    } catch (error) {
        console.error("Erro na chamada da API Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Falha na comunicação com a IA: ${error.message}`);
        }
        throw new Error("Ocorreu um erro desconhecido ao comunicar com a IA.");
    }
};

export const generateLessonPlan = async (apiKey: string, input: LessonPlanInput): Promise<Omit<LessonPlan, 'id' | 'createdAt' | keyof LessonPlanInput>> => {
  const { date, grade, subject, topic, educationLevel, teacherName, schoolName } = input;

  const prompt = `
    Por favor, crie um plano de aula detalhado e estruturado.
    - Professor(a): ${teacherName}
    - Escola: ${schoolName}
    - Data: ${date}
    - Nível de Ensino: ${educationLevel}
    - Turma/Série: ${grade}
    - Disciplina: ${subject}
    - Conteúdo Específico: ${topic}

    O plano deve ser criativo, prático e estritamente adequado para o nível de ensino e a turma especificada.
    Siga o schema JSON fornecido para a resposta.
  `;

  return handleApiCall(apiKey, prompt, lessonPlanSchema);
};

export const generateActivities = async (apiKey: string, plan: Pick<LessonPlan, 'educationLevel' | 'topic' | 'subject'>): Promise<{ activities: string[] }> => {
    const prompt = `
        Com base no seguinte contexto de aula:
        - Nível de Ensino: ${plan.educationLevel}
        - Disciplina: ${plan.subject}
        - Conteúdo: ${plan.topic}

        Gere uma lista de 3 a 4 atividades (lúdicas ou não, dependendo do nível de ensino) para os alunos. Detalhe cada atividade com um título e uma breve descrição de como executá-la.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            activities: {
                type: Type.ARRAY,
                description: "Lista de atividades detalhadas, cada uma com título e descrição.",
                items: { type: Type.STRING }
            }
        },
        required: ["activities"]
    };
    return handleApiCall(apiKey, prompt, schema);
};

export const generateAdaptedActivities = async (apiKey: string, plan: LessonPlan): Promise<{ activities: string[] }> => {
    const prompt = `
        Com base no seguinte plano de aula JÁ ADAPTADO para um aluno com necessidades específicas:
        - Nível de Ensino: ${plan.educationLevel}
        - Disciplina: ${plan.subject}
        - Conteúdo: ${plan.topic}
        - Necessidades do Aluno: "${plan.studentNeeds}"
        - Objetivos Adaptados: ${plan.objectives.join('; ')}

        Gere uma lista de 3 a 4 atividades ADAPTADAS. As atividades devem ser diretamente ligadas aos objetivos já adaptados e considerar as necessidades específicas do aluno para garantir sua participação e aprendizado. Detalhe cada atividade com um título e uma breve descrição de como executá-la de forma inclusiva.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            activities: {
                type: Type.ARRAY,
                description: "Lista de atividades ADAPTADAS e detalhadas, cada uma com título e descrição.",
                items: { type: Type.STRING }
            }
        },
        required: ["activities"]
    };
    return handleApiCall(apiKey, prompt, schema);
};


const adaptedPlanSchema = {
    type: Type.OBJECT,
    properties: {
        bnccSkills: {
            type: Type.ARRAY,
            description: "Adapte ou mantenha as habilidades da BNCC. Se a habilidade principal for muito complexa, sugira uma de base, mais simples, do mesmo eixo.",
            items: { type: Type.STRING }
        },
        objectives: {
            type: Type.ARRAY,
            description: "Adapte os objetivos para serem alcançáveis pelo aluno, talvez quebrando um objetivo complexo em etapas menores.",
            items: { type: Type.STRING }
        },
        methodology: {
            type: Type.STRING,
            description: "Adapte a metodologia. Sugira estratégias específicas, como instruções mais diretas, uso de recursos visuais, tempos de atividade mais curtos, ou mediação individualizada."
        },
        resources: {
            type: Type.ARRAY,
            description: "Adapte a lista de recursos. Sugira materiais táteis, softwares de acessibilidade, pranchas de comunicação, ou itens de manipulação.",
            items: { type: Type.STRING }
        },
        assessment: {
            type: Type.ARRAY,
            description: "Adapte os métodos de avaliação. Sugira avaliação oral, por observação, trabalhos práticos com critérios ajustados ou testes com mais tempo ou em formato diferente.",
            items: { type: Type.STRING }
        },
        activities: {
            type: Type.ARRAY,
            description: "Adapte as atividades sugeridas (se houver) ou crie novas atividades inclusivas. As atividades devem ser diretamente relacionadas aos objetivos adaptados.",
            items: { type: Type.STRING }
        }
    },
    required: ["bnccSkills", "objectives", "methodology", "resources", "assessment", "activities"]
};

export const generateInclusionPlan = async (apiKey: string, originalPlan: LessonPlan, studentNeeds: string, studentName?: string): Promise<Omit<LessonPlan, 'id' | 'createdAt' | keyof LessonPlanInput>> => {
  const { subject, topic, educationLevel, grade, bnccSkills, objectives, methodology, resources, assessment, activities } = originalPlan;

  const prompt = `
    Por favor, adapte o seguinte plano de aula para um aluno com necessidades específicas. Gere um plano de aula completo e adaptado, mantendo a mesma estrutura do original.

    **Informações do Aluno:**
    - Nome: ${studentName || 'Não especificado'}
    - Necessidades Específicas: "${studentNeeds}"

    **Plano de Aula Original:**
    - Nível de Ensino: ${educationLevel}
    - Turma/Série: ${grade}
    - Disciplina: ${subject}
    - Conteúdo Específico: ${topic}
    - Habilidades BNCC Originais: ${bnccSkills.join('; ')}
    - Objetivos Originais: ${objectives.join('; ')}
    - Metodologia Original: ${methodology}
    - Recursos Originais: ${resources.join('; ')}
    - Avaliação Original: ${assessment.join('; ')}
    - Atividades Originais: ${activities?.join('; ') || 'Nenhuma'}

    **Sua Tarefa:**
    Com base nas necessidades do aluno, gere um novo plano de aula totalmente adaptado. Modifique cada seção (Habilidades, Objetivos, Metodologia, Recursos, Avaliação e Atividades) para garantir a inclusão e o sucesso do aluno. Mantenha o foco no conteúdo principal, mas ajuste a complexidade, os materiais e as abordagens. Responda seguindo o schema JSON fornecido.
  `;

  const adaptedContent = await handleApiCall(apiKey, prompt, adaptedPlanSchema);
  return adaptedContent;
};
