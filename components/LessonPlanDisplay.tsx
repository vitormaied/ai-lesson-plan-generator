
import React, { useState, useRef, useEffect } from 'react';
import type { LessonPlan } from '../types';
import { BookOpen, Target, ClipboardList, Edit3, Save, XCircle, FileDown, Sparkles, FileText, School, User, Lightbulb, Puzzle, Accessibility, Calendar } from './Icons';
import jsPDF from 'jspdf';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import saveAs from 'file-saver';

interface LessonPlanDisplayProps {
  plan: LessonPlan | null;
  onUpdatePlan: (updatedPlan: LessonPlan) => void;
  onGenerateActivities: (plan: LessonPlan) => void;
  onGenerateAdaptedActivities: (plan: LessonPlan) => void;
  onGenerateInclusionPlan: (plan: LessonPlan, needs: string, studentName?: string) => void;
  isSubLoading: {[key: string]: boolean};
}

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; actions?: React.ReactNode;}> = ({ icon, title, children, actions }) => (
  <div className="mb-6 break-inside-avoid">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center">
        <span className="text-primary">{icon}</span>
        <h3 className="ml-3 text-xl font-bold text-gray-800">{title}</h3>
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
    <div className="pl-9 text-gray-700">{children}</div>
  </div>
);

const EditableField: React.FC<{ value: string | string[], onChange: (newValue: string | string[]) => void, isEditing: boolean, isList?: boolean, placeholder?: string }> = ({ value, onChange, isEditing, isList = false, placeholder }) => {
  if (!isEditing) {
    if (isList && Array.isArray(value) && value.length > 0) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, index) => <li key={index} className="whitespace-pre-wrap">{item}</li>)}
        </ul>
      );
    }
    return <p className="whitespace-pre-wrap">{String(value) || <span className="text-gray-400">{placeholder}</span>}</p>;
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isList) {
      onChange(e.target.value.split('\n'));
    } else {
      onChange(e.target.value);
    }
  };

  const textValue = isList && Array.isArray(value) ? value.join('\n') : String(value);

  return (
    <textarea
      value={textValue}
      onChange={handleTextChange}
      className="w-full p-2 border border-gray-300 rounded-md bg-blue-50 focus:ring-primary focus:border-primary"
      placeholder={placeholder}
      rows={isList ? 5 : textValue.split('\n').length + 2}
    />
  );
};

const LoadingButton: React.FC<{isLoading: boolean, onClick: () => void, children: React.ReactNode, className?: string, disabled?: boolean}> = ({ isLoading, onClick, children, className, disabled}) => (
    <button onClick={onClick} disabled={isLoading || disabled} className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-white bg-secondary hover:bg-opacity-80 disabled:bg-gray-400 transition-colors ${className}`}>
        {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Gerando...
            </>
          ) : (
            children
        )}
    </button>
);

export const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({ plan, onUpdatePlan, onGenerateActivities, onGenerateAdaptedActivities, onGenerateInclusionPlan, isSubLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editablePlan, setEditablePlan] = useState<LessonPlan | null>(plan);
  const [inclusionNeeds, setInclusionNeeds] = useState('');
  const [studentName, setStudentName] = useState('');
  
  useEffect(() => {
    setEditablePlan(plan);
    setIsEditing(false);
    setInclusionNeeds('');
    setStudentName('');
  }, [plan]);

  const generateDocx = (title: string, sections: {title: string, content: string | string[], isList?: boolean}[]) => {
     const docSections = sections.flatMap(section => [
        new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }),
        ...(Array.isArray(section.content)
            ? section.content.map(item => new Paragraph({ text: item, bullet: { level: 0 } }))
            : section.content.split('\n').filter(p => p.trim() !== '').map(p => new Paragraph(p))
        ),
        new Paragraph(""), 
     ]);

     const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph(""),
                ...docSections
            ],
        }],
    });
    
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${title.replace(/[\/\\?%*:|"<>]/g, '-')}.docx`);
    });
  }

  const handleExportDOCX = () => {
    if (!plan) return;
    const isAdapted = plan.isAdapted;
    const title = isAdapted ? `Plano de Aula Adaptado - ${plan.subject}` : `Plano de Aula - ${plan.subject}`;

    let headerItems = [
      `Escola: ${plan.schoolName}`,
      `Professor(a): ${plan.teacherName}`,
      `Nível: ${plan.educationLevel}`,
      `Turma: ${plan.grade}`,
      `Data: ${new Date(plan.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`,
    ];
    if (isAdapted && plan.studentNeeds) {
        headerItems.push('');
        headerItems.push(`Adaptação para: ${plan.studentName || 'Não especificado'}`);
        headerItems.push(`Necessidades: ${plan.studentNeeds}`);
    }

    generateDocx(title, [
        {title: "Cabeçalho", content: headerItems.join('\n')},
        {title: "Conteúdo Específico", content: plan.topic},
        {title: "Habilidades da BNCC", content: plan.bnccSkills, isList: true},
        {title: "Objetivos de Aprendizagem", content: plan.objectives, isList: true},
        {title: "Metodologia", content: plan.methodology},
        {title: "Recursos", content: plan.resources, isList: true},
        {title: "Avaliação", content: plan.assessment, isList: true},
        ...(plan.activities ? [{title: "Atividades Sugeridas", content: plan.activities, isList: true}] : []),
    ]);
  };
  
  const handleExportPDF = () => {
    if (!plan) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - (2 * margin);
    let y = margin;

    const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };
    
    const writeText = (text: string, size: number, style: 'bold' | 'normal', options: any = {}) => {
        doc.setFontSize(size);
        doc.setFont(undefined, style);
        const lines = doc.splitTextToSize(text, options.w || usableWidth);
        checkPageBreak(lines.length * (size * 0.35)); // Approximation of line height
        doc.text(lines, options.x || margin, y, options);
        y += (lines.length * (size * 0.35)) + (options.mb || 0);
    };

    const writeSection = (title: string, content: string | string[]) => {
        checkPageBreak(20); // Space for section
        y += 5; // Margin top for section
        writeText(title, 14, 'bold', { mb: 4 });
        
        if (Array.isArray(content)) {
            content.forEach(item => {
                const itemText = `•  ${item}`;
                writeText(itemText, 11, 'normal', { x: margin + 4, w: usableWidth - 4, mb: 2 });
            });
        } else {
            writeText(content, 11, 'normal', { mb: 4 });
        }
        y+= 5;
    };
    
    // --- Document Generation ---
    const title = plan.isAdapted ? `Plano de Aula Adaptado - ${plan.subject}` : `Plano de Aula - ${plan.subject}`;
    writeText(title, 18, 'bold', { align: 'center', x: pageWidth / 2, mb: 10 });
    
    // Header
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const headerContent = [
        `Escola: ${plan.schoolName}`,
        `Professor(a): ${plan.teacherName}`,
        `Nível: ${plan.educationLevel}`,
        `Turma: ${plan.grade}`,
        `Data: ${new Date(plan.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`,
        `Aulas: ${plan.lessonCount} ${plan.lessonCount === 1 ? 'aula' : 'aulas'} solicitada${plan.lessonCount !== 1 ? 's' : ''}`,
    ];
    headerContent.forEach(line => writeText(line, 10, 'normal', { mb: 2}));

    if (plan.suggestedLessonCount && plan.suggestedLessonCount !== plan.lessonCount) {
        y += 4;
        writeText(`Sugestão da IA: Este conteúdo seria melhor trabalhado em ${plan.suggestedLessonCount} ${plan.suggestedLessonCount === 1 ? 'aula' : 'aulas'}`, 10, 'normal', { mb: 2});
    }

    if (plan.isAdapted) {
        y += 4;
        writeText(`Adaptação para: ${plan.studentName || 'Não especificado'}`, 10, 'normal', { mb: 2});
        writeText(`Necessidades: ${plan.studentNeeds}`, 10, 'normal', { mb: 2});
    }

    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    
    // Body Sections
    writeSection("Conteúdo Específico", plan.topic);
    writeSection("Habilidades da BNCC", plan.bnccSkills);
    writeSection("Objetivos de Aprendizagem", plan.objectives);
    writeSection("Metodologia", plan.methodology);
    writeSection("Recursos", plan.resources);
    writeSection("Avaliação", plan.assessment);

    if (plan.activities && plan.activities.length > 0) {
        writeSection("Atividades Sugeridas", plan.activities);
    }
    
    const filename = plan.isAdapted 
        ? `Plano_Adaptado_${plan.subject}_${plan.date}.pdf`
        : `Plano_de_Aula_${plan.subject}_${plan.date}.pdf`;
    doc.save(filename);
};

  const handleEditToggle = () => {
    if (isEditing && editablePlan) {
      onUpdatePlan(editablePlan);
    }
    setIsEditing(!isEditing);
  };
  
  const handleCancelEdit = () => {
      setEditablePlan(plan);
      setIsEditing(false);
  }

  const handleFieldChange = (field: keyof Omit<LessonPlan, 'id'|'createdAt'|'isAdapted'|'studentName'|'studentNeeds'>, value: string | string[]) => {
      if (editablePlan) {
          setEditablePlan({ ...editablePlan, [field]: value });
      }
  };

  if (!plan || !editablePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-10 rounded-lg shadow-lg text-center">
        <Sparkles className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo ao Gerador de Plano de Aula!</h2>
        <p className="text-gray-600 max-w-md">Preencha o formulário à esquerda para criar seu primeiro plano de aula com a ajuda da nossa Inteligência Artificial.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg relative h-full overflow-y-auto">
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
         {isEditing ? (
            <>
                <button onClick={handleEditToggle} className="flex items-center bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"><Save size={16} className="mr-1" /> Salvar</button>
                <button onClick={handleCancelEdit} className="flex items-center bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"><XCircle size={16} className="mr-1" /> Cancelar</button>
            </>
         ) : (
             <>
                <button onClick={() => setIsEditing(true)} className="flex items-center bg-secondary text-white px-3 py-2 rounded-md hover:bg-opacity-80 transition-colors text-sm"><Edit3 size={16} className="mr-1" /> Editar</button>
                <button onClick={handleExportPDF} className="flex items-center bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"><FileDown size={16} className="mr-1" /> PDF</button>
                <button onClick={handleExportDOCX} className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"><FileDown size={16} className="mr-1" /> DOCX</button>
             </>
         )}
      </div>
      <div className="p-2 sm:p-4">
        <header className="mb-8 border-b-2 border-gray-100 pb-6">
          <h1 className="text-3xl font-extrabold text-primary mb-4 text-center">
            {plan.isAdapted ? `Plano de Aula Adaptado - ${plan.subject}` : `Plano de Aula - ${plan.subject}`}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
             <div className="flex items-start"><School className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" /><span className="font-semibold text-gray-600">Escola:</span><span className="ml-2 text-gray-800">{plan.schoolName}</span></div>
             <div className="flex items-start"><User className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" /><span className="font-semibold text-gray-600">Professor(a):</span><span className="ml-2 text-gray-800">{plan.teacherName}</span></div>
             <div className="flex items-start"><ClipboardList className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" /><span className="font-semibold text-gray-600">Nível:</span><span className="ml-2 text-gray-800">{plan.educationLevel}</span></div>
             <div className="flex items-start"><ClipboardList className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" /><span className="font-semibold text-gray-600">Turma:</span><span className="ml-2 text-gray-800">{plan.grade}</span></div>
             <div className="flex items-start"><Calendar className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" /><span className="font-semibold text-gray-600">Data:</span><span className="ml-2 text-gray-800">{new Date(plan.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span></div>
             <div className="flex items-start"><BookOpen className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" /><span className="font-semibold text-gray-600">Aulas:</span><span className="ml-2 text-gray-800">{plan.lessonCount} {plan.lessonCount === 1 ? 'aula' : 'aulas'} solicitada{plan.lessonCount !== 1 ? 's' : ''}</span></div>
          </div>
          {plan.suggestedLessonCount && plan.suggestedLessonCount !== plan.lessonCount && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-blue-800">Sugestão da IA: </span>
                  <span className="text-blue-700">Este conteúdo seria melhor trabalhado em {plan.suggestedLessonCount} {plan.suggestedLessonCount === 1 ? 'aula' : 'aulas'}</span>
                </div>
              </div>
            </div>
          )}
          {plan.isAdapted && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex items-start">
                    <User className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold text-gray-700">Aluno: </span>
                        <span className="text-gray-800">{plan.studentName || 'Não especificado'}</span>
                    </div>
                </div>
                <div className="md:col-span-2 flex items-start">
                    <Accessibility className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold text-gray-700">Necessidades Específicas: </span>
                        <span className="text-gray-800">{plan.studentNeeds}</span>
                    </div>
                </div>
            </div>
          )}
        </header>
        <main>
          <Section icon={<Lightbulb size={24} />} title="Conteúdo Específico">
             <EditableField value={editablePlan.topic} onChange={(v) => handleFieldChange('topic', v)} isEditing={isEditing} />
          </Section>
          <Section icon={<BookOpen size={24} />} title="Habilidades da BNCC">
             <EditableField value={editablePlan.bnccSkills} onChange={(v) => handleFieldChange('bnccSkills', v)} isEditing={isEditing} isList />
          </Section>
          <Section icon={<Target size={24} />} title="Objetivos de Aprendizagem">
             <EditableField value={editablePlan.objectives} onChange={(v) => handleFieldChange('objectives', v)} isEditing={isEditing} isList />
          </Section>
          <Section icon={<ClipboardList size={24} />} title="Metodologia">
            <EditableField value={editablePlan.methodology} onChange={(v) => handleFieldChange('methodology', v)} isEditing={isEditing} />
          </Section>
          <Section icon={<BookOpen size={24} />} title="Recursos">
            <EditableField value={editablePlan.resources} onChange={(v) => handleFieldChange('resources', v)} isEditing={isEditing} isList />
          </Section>
          <Section icon={<FileText size={24} />} title="Avaliação">
            <EditableField value={editablePlan.assessment} onChange={(v) => handleFieldChange('assessment', v)} isEditing={isEditing} isList />
          </Section>

          <hr className="my-8 border-gray-200" />
          
          <Section icon={<Puzzle size={24} />} title="Atividades Sugeridas" actions={!isEditing && plan.activities && <button onClick={() => generateDocx('Atividades Sugeridas', [{title: '', content: plan.activities || [], isList: true}])} className="flex items-center text-blue-500 hover:text-blue-600 text-sm"><FileDown size={16} className="mr-1"/> DOCX</button>}>
            {plan.activities ? (
                <EditableField value={editablePlan.activities || []} onChange={(v) => handleFieldChange('activities', v)} isEditing={isEditing} isList />
            ) : (
                <div className="text-center p-4 border-2 border-dashed rounded-lg">
                    {plan.isAdapted ? (
                        <>
                           <p className="text-gray-600 mb-4">Gere atividades inclusivas para este plano adaptado.</p>
                           <LoadingButton isLoading={!!isSubLoading['adaptedActivities']} onClick={() => onGenerateAdaptedActivities(plan)}><Sparkles size={16} className="mr-2"/>Gerar Atividades Adaptadas</LoadingButton>
                        </>
                    ) : (
                       <>
                           <p className="text-gray-600 mb-4">Gere atividades práticas e lúdicas para esta aula.</p>
                           <LoadingButton isLoading={!!isSubLoading['activities']} onClick={() => onGenerateActivities(plan)}><Sparkles size={16} className="mr-2"/>Gerar Atividades com IA</LoadingButton>
                       </>
                    )}
                </div>
            )}
          </Section>

          <Section icon={<Accessibility size={24} />} title="Assistente de Inclusão">
            <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 space-y-3">
                <p className="text-gray-600">Gere uma versão adaptada deste plano para um aluno com necessidades específicas. O plano adaptado será salvo como um novo item no seu histórico.</p>
                <div>
                   <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">Nome do Aluno (Opcional)</label>
                   <input 
                        id="studentName"
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-200"
                        disabled={isEditing || !!isSubLoading['inclusion']}
                    />
                </div>
                <div>
                    <label htmlFor="inclusionNeeds" className="block text-sm font-medium text-gray-700 mb-1">Necessidades Específicas do Aluno</label>
                    <textarea 
                        id="inclusionNeeds"
                        value={inclusionNeeds} 
                        onChange={(e) => setInclusionNeeds(e.target.value)} 
                        placeholder="Ex: Aluno com TDAH, necessita de comandos diretos e atividades mais curtas. Ou, aluna com baixa visão, precisa de materiais ampliados." 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-200" 
                        rows={3}
                        disabled={isEditing || !!isSubLoading['inclusion']}
                    ></textarea>
                </div>
                <LoadingButton 
                    isLoading={!!isSubLoading['inclusion']} 
                    onClick={() => onGenerateInclusionPlan(plan, inclusionNeeds, studentName)}
                    disabled={isEditing || !inclusionNeeds.trim() || !!isSubLoading['inclusion']}
                >
                    <Sparkles size={16} className="mr-2"/>Gerar Plano Adaptado
                </LoadingButton>
                {isEditing && <p className="text-xs text-gray-500 mt-2">Salve ou cancele a edição para gerar um plano adaptado.</p>}
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
};
