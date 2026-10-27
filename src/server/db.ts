import fs from 'fs';
import path from 'path';
import { Project, GenerationJob } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'proj_silk_road_sample',
    ownerUid: 'demo_user',
    topic: 'أسرار طريق الحرير التجاري: الشريان الذي ربط الشرق بالغرب',
    settings: {
      duration: 30,
      visualStyle: 'vox_maps',
      aspectRatio: '9:16',
      voice: 'Fenrir',
      enableSubtitles: true,
      enableBackgroundMusic: true,
      musicTrack: 'ambient_documentary',
      musicVolume: 0.2,
      costMode: 'economy',
      isDemoMode: true,
      additionalInstructions: 'التركيز على القوافل التجارية ونقل الورق والحرير',
    },
    script: {
      title: 'طريق الحرير: شبكة التجارة التي غيّرت العالم',
      topicSummary: 'رحلة عبر آلاف الكيلومترات من الصين إلى بلاد الشام، حملت أكثر من مجرد بضائع؛ بل نقلت الأفكار والعلوم.',
      narrationLanguage: 'ar',
      targetDuration: 30,
      historicalUncertaintyNotes: 'تاريخ بداية التسمية يعود للجغرافي الألماني فرديناند فون ريشتهوفن في القرن التاسع عشر.',
      sourceReferences: [
        'الموسوعة التاريخية: شبكات التجارة القديمة (اليونسكو)',
        'تاريخ آسيا الوسطى وطرق القوافل الإسلامية'
      ],
      fullNarrationScript: 'لم يكن طريق الحرير مجرد درب واحد، بل شبكة معقدة عبرت الصحاري والجبال الشاهقة. من أسواق سمرقند إلى دمشق، لم تنتقل الأقمشة والتوابل فحسب، بل ازدهرت العلوم وسافر الورق ليغير مسار الحضارة الإنسانية إلى الأبد.',
      scenes: [
        {
          sceneNumber: 1,
          durationSeconds: 10,
          onScreenTitle: 'شبكة شريانية عبر القارات',
          narrationSegment: 'لم يكن طريق الحرير مجرد درب واحد، بل شبكة معقدة عبرت الصحاري والجبال الشاهقة.',
          visualDescription: 'خريطة بأسلوب فوكس تظهر تفرعات الطرق التجارية من شيآن الصينية إلى آسيا الوسطى والبحر المتوسط.',
          generationPrompt: 'Vox style vintage cartography, glowing silk road trade lines, deserts and mountain passes, ancient parchment tones and gold accents, 9:16 ratio',
          transitionSuggestion: 'تلاشي تدريجي مع زوم خفيف',
          sourceOrVerificationNotes: 'موثق تاريخياً: تفرعات الشمال والجنوب لطريق الحرير'
        },
        {
          sceneNumber: 2,
          durationSeconds: 10,
          onScreenTitle: 'سمرقند: ملتقى القوافل والأفكار',
          narrationSegment: 'من أسواق سمرقند إلى دمشق، لم تنتقل الأقمشة والتوابل فحسب، بل ازدهرت العلوم.',
          visualDescription: 'رسوم كولاجية وثائقية تظهر قوافل الجمال وقباب سمرقند والأسواق القديمة.',
          generationPrompt: 'Editorial paper cutout illustration of Samarkand minarets, camel caravans, ancient silk rolls and spices, dramatic atmospheric lighting',
          transitionSuggestion: 'انتقال جانبي سريع بانتقال سينمائي',
          sourceOrVerificationNotes: 'سجلات ابن بطوطة والرحالة القدامى حول سمرقند'
        },
        {
          sceneNumber: 3,
          durationSeconds: 10,
          onScreenTitle: 'ثورة الورق والمعرفة',
          narrationSegment: 'وسافر الورق عبر هذا الشريان ليغير مسار تدوين العلوم والحضارة الإنسانية إلى الأبد.',
          visualDescription: 'مخطوطات عربية قديمة وحروف تتطاير فوق خريطة العالم الإسلامي مع توهج ذهبي.',
          generationPrompt: 'Ancient Islamic calligraphy manuscript, floating letters over world map, warm golden hour documentary lighting, 9:16 portrait composition',
          transitionSuggestion: 'تعتيم هادئ نحو النهاية',
          sourceOrVerificationNotes: 'معركة طلاس 751م وانتقال صناعة الورق لبغداد وسمرقند'
        }
      ]
    },
    status: 'completed',
    estimatedCost: '$0.00 (وضع تجريبي)',
    actualTrackedCost: '$0.00',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 23).toISOString(),
  },
  {
    id: 'proj_coffee_origin_sample',
    ownerUid: 'demo_user',
    topic: 'تاريخ القهوة: كيف بدأت في اليمن وغزت مقاهي العالم',
    settings: {
      duration: 60,
      visualStyle: 'paper_cutout',
      aspectRatio: '9:16',
      voice: 'Kore',
      enableSubtitles: true,
      enableBackgroundMusic: true,
      musicTrack: 'ambient_documentary',
      musicVolume: 0.25,
      costMode: 'economy',
      isDemoMode: true,
      additionalInstructions: 'التركيز على ميناء المخا ورحلة تصدير البن',
    },
    script: {
      title: 'الذهب الأسود: من جبال اليمن إلى فناجين العالم',
      topicSummary: 'قصة اكتشاف شجرة البن وتطور تحميصه في مجالس الصوفية باليمن حتى انطلاقه من ميناء المخا التاريخي.',
      narrationLanguage: 'ar',
      targetDuration: 60,
      historicalUncertaintyNotes: 'أسطورة الراعي كالدي الإثيوبية لا يوجد توثيق تاريخي معاصر يؤكدها قبل القرن السابع عشر.',
      sourceReferences: [
        'عمدة الصفوة في حل القهوة - الجزيري الحنبلي (القرن السادس عشر)',
        'تاريخ التجارة البحرية في البحر الأحمر وميناء المخا'
      ],
      fullNarrationScript: 'في مرتفعات اليمن الخصبة في القرن الخامس عشر، بدأ فصل جديد في تاريخ المشروبات. استخدمها المتصوفة للسهر في التعبد، وسرعان ما غدت شراباً مجتمعياً أصيلاً. عبر ميناء المخا اليمني، أبحر "الموكا" الشهير إلى البلاطات الأوروبية ليوقظ عصر التنوير.',
      scenes: [
        {
          sceneNumber: 1,
          durationSeconds: 15,
          onScreenTitle: 'مرتفعات اليمن والبدايات الأولى',
          narrationSegment: 'في مرتفعات اليمن الخصبة في القرن الخامس عشر، بدأ فصل جديد في تاريخ المشروبات الإنسانية.',
          visualDescription: 'مدرجات زراعية خضراء في جبال حراز اليمنية مع حبات بن حمراء تتلألأ في شمس الصباح.',
          generationPrompt: 'Yemen mountain agricultural terraces, ripe red coffee cherries, paper cutout collage layered aesthetic, rich earthy charcoal and antique gold',
          transitionSuggestion: 'تقريب بطيء على حبات البن',
          sourceOrVerificationNotes: 'أقدم توثيق للشرب المنتظم في اليمن منتصف القرن 15م'
        },
        {
          sceneNumber: 2,
          durationSeconds: 15,
          onScreenTitle: 'مجالس الذكر والتأمل',
          narrationSegment: 'استخدمها الصوفية للاستيقاظ في ليالي التأمل والذكر، قبل أن تنتقل إلى البيوت والأسواق.',
          visualDescription: 'دخان يتصاعد من إبريق قهوة طيني تقليدي مع خلفية داكنة وزخارف إسلامية هندسية هادئة.',
          generationPrompt: 'Traditional Yemeni clay coffee pot dallah, aromatic steam rising, geometric Islamic motifs, warm chiaroscuro documentary lighting',
          transitionSuggestion: 'انتقال ناعم متداخل',
          sourceOrVerificationNotes: 'مخطوطات الجزيري حول الشيخ الذبحاني'
        },
        {
          sceneNumber: 3,
          durationSeconds: 15,
          onScreenTitle: 'ميناء المخا وسر "الموكا"',
          narrationSegment: 'ومن ميناء المخا التاريخي على البحر الأحمر، صُدّرت أكياس البن ليطلق العالم اسم الموكا على أطيب قهوة.',
          visualDescription: 'سفن شراعية خشبية قديمة في ميناء المخا التاريخي مع شروق الشمس وأكياس البن على الأرصفة.',
          generationPrompt: 'Historic Port of Mocha Yemen, dhow trading ships, vintage map routes across Red Sea, charcoal and parchment tones with gold accents',
          transitionSuggestion: 'حركة بان أفقية على الميناء',
          sourceOrVerificationNotes: 'وثائق شركة الهند الشرقية وميناء المخا'
        },
        {
          sceneNumber: 4,
          durationSeconds: 15,
          onScreenTitle: 'المقاهي وعصر التنوير',
          narrationSegment: 'لتتحول القهوة في لندن وباريس والقاهرة إلى وقود للمفكرين ومجالس النقاش التي صاغت العصر الحديث.',
          visualDescription: 'مشهد لمقهى تاريخي يضم مفكرين وصحفاً مع فنجان قهوة في الصدارة.',
          generationPrompt: 'Historic 17th century coffeehouse, intellectual gathering, steaming cup, documentary vintage aesthetic, antique gold highlights',
          transitionSuggestion: 'تعتيم هادئ',
          sourceOrVerificationNotes: 'تاريخ المقاهي ودورها في الثورات الفكرية'
        }
      ]
    },
    status: 'completed',
    estimatedCost: '$0.00 (وضع تجريبي)',
    actualTrackedCost: '$0.00',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 47).toISOString(),
  }
];

class Database {
  private projects: Map<string, Project> = new Map();
  private jobs: Map<string, GenerationJob> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(PROJECTS_FILE)) {
        const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
        const list: Project[] = JSON.parse(raw);
        for (const p of list) {
          this.projects.set(p.id, p);
        }
      } else {
        // Initialize with samples
        for (const p of SAMPLE_PROJECTS) {
          this.projects.set(p.id, p);
        }
        this.saveProjects();
      }
    } catch (err) {
      console.error('Error loading projects from disk:', err);
      for (const p of SAMPLE_PROJECTS) {
        this.projects.set(p.id, p);
      }
    }

    try {
      if (fs.existsSync(JOBS_FILE)) {
        const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
        const list: GenerationJob[] = JSON.parse(raw);
        for (const j of list) {
          this.jobs.set(j.id, j);
        }
      }
    } catch (err) {
      console.error('Error loading jobs from disk:', err);
    }
  }

  private saveProjects() {
    try {
      const list = Array.from(this.projects.values());
      const tempFile = `${PROJECTS_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
      fs.renameSync(tempFile, PROJECTS_FILE);
    } catch (err) {
      console.error('Error saving projects to disk:', err);
    }
  }

  private saveJobs() {
    try {
      const list = Array.from(this.jobs.values());
      const tempFile = `${JOBS_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
      fs.renameSync(tempFile, JOBS_FILE);
    } catch (err) {
      console.error('Error saving jobs to disk:', err);
    }
  }

  // Project operations
  getAllProjects(): Project[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  saveProject(project: Project): Project {
    project.updatedAt = new Date().toISOString();
    this.projects.set(project.id, project);
    this.saveProjects();
    return project;
  }

  deleteProject(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) {
      this.saveProjects();
    }
    return deleted;
  }

  // Job operations
  getJob(id: string): GenerationJob | undefined {
    return this.jobs.get(id);
  }

  saveJob(job: GenerationJob): GenerationJob {
    this.jobs.set(job.id, job);
    this.saveJobs();
    return job;
  }

  addJobLog(jobId: string, stage: GenerationJob['currentStage'], message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const job = this.jobs.get(jobId);
    if (job) {
      job.logs.push({
        timestamp: new Date().toISOString(),
        stage,
        message,
        level,
      });
      this.saveJob(job);
    }
  }
}

export const db = new Database();
