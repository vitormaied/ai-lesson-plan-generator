import React from 'react';
import { BookOpen, Accessibility, Sparkles, FileDown, BrainCircuit } from '../components/Icons';

const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="flex flex-col items-center p-6 text-center bg-white rounded-lg shadow-lg">
        <div className="mb-4 text-primary">{icon}</div>
        <h3 className="mb-2 text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-600">{children}</p>
    </div>
);

export const LandingPage: React.FC = () => {
    return (
        <div className="bg-gray-50">
            {/* Hero Section */}
            <section className="py-20 sm:py-24 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <BrainCircuit className="mx-auto h-16 w-16 text-primary mb-4" />
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900">
                        Revolucione seu Planejamento de Aulas
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600">
                        Crie planos de aula completos, alinhados à BNCC e personalizados em segundos. Deixe a Inteligência Artificial ser sua maior aliada na sala de aula.
                    </p>
                    <div className="mt-8 flex justify-center gap-4 flex-wrap">
                        <a href="#/register" className="inline-block px-8 py-3 text-lg font-semibold text-white bg-primary rounded-lg shadow-md hover:bg-primary-dark transition-colors">
                            Comece Gratuitamente
                        </a>
                        <a href="#/login" className="inline-block px-8 py-3 text-lg font-semibold text-primary bg-white border border-primary rounded-lg shadow-md hover:bg-gray-100 transition-colors">
                            Fazer Login
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">
                        Tudo que um Professor Precisa
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard icon={<Sparkles size={48} />} title="Geração Instantânea">
                            Basta inserir o conteúdo e a turma. A IA cuida de todo o resto, economizando seu tempo precioso.
                        </FeatureCard>
                        <FeatureCard icon={<BookOpen size={48} />} title="Alinhado à BNCC">
                            Receba sugestões automáticas das habilidades e competências da BNCC relevantes para sua aula.
                        </FeatureCard>
                        <FeatureCard icon={<Accessibility size={48} />} title="Assistente de Inclusão">
                            Adapte planos de aula para alunos com necessidades específicas com apenas um clique.
                        </FeatureCard>
                        <FeatureCard icon={<FileDown size={48} />} title="Exporte e Edite">
                            Salve seus planos nos formatos PDF e DOCX, prontos para serem usados ou personalizados.
                        </FeatureCard>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-12">
                        Como Funciona? É Simples.
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center h-24 w-24 mb-6 bg-primary bg-opacity-10 rounded-full text-primary text-4xl font-bold">1</div>
                            <h3 className="mb-2 text-xl font-bold text-gray-800">Insira os Dados</h3>
                            <p className="text-gray-600">Informe a turma, disciplina e o conteúdo da aula.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center h-24 w-24 mb-6 bg-primary bg-opacity-10 rounded-full text-primary text-4xl font-bold">2</div>
                            <h3 className="mb-2 text-xl font-bold text-gray-800">Gere com IA</h3>
                            <p className="text-gray-600">Nossa IA cria um plano completo em segundos.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center h-24 w-24 mb-6 bg-primary bg-opacity-10 rounded-full text-primary text-4xl font-bold">3</div>
                            <h3 className="mb-2 text-xl font-bold text-gray-800">Use e Adapte</h3>
                            <p className="text-gray-600">Exporte, edite e personalize como preferir.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 sm:py-24">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                        Pronto para Otimizar seu Tempo?
                    </h2>
                    <p className="mt-2 max-w-xl mx-auto text-lg text-gray-600 mb-8">
                        Junte-se a milhares de professores que já estão transformando seu planejamento.
                    </p>
                    <a href="#/register" className="inline-block px-10 py-4 text-xl font-semibold text-white bg-secondary rounded-lg shadow-md hover:bg-opacity-90 transition-colors">
                        Criar minha conta gratuita agora
                    </a>
                </div>
            </section>
        </div>
    );
};
