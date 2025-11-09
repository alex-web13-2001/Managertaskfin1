// Demo data generator for new users
import * as kv from "./kv_store.tsx";

export async function createDemoData(userId: string) {
  try {
    // Create demo projects
    const project1Id = crypto.randomUUID();
    const project2Id = crypto.randomUUID();

    // Get user profile to include in project members
    const userProfile = await kv.get(`user:${userId}`);
    const userName = userProfile?.name || 'Пользователь';
    const userEmail = userProfile?.email || '';

    const demoProjects = [
      {
        id: project1Id,
        name: "Ваш первый проект",
        description: "Это демонстрационный проект для знакомства с системой. Здесь вы можете создавать задачи, управлять статусами и приглашать участников.",
        color: "purple",
        category: "Разработка, Дизайн, Тестирование",
        availableCategories: [developmentCategoryId, designCategoryId, testingCategoryId],
        userId,
        members: [
          {
            id: `member-${Date.now()}-1`,
            userId: userId,
            email: userEmail,
            name: userName,
            role: 'owner',
            addedDate: new Date().toISOString(),
            addedBy: userId,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: project2Id,
        name: "Ваш второй проект",
        description: "Второй демонстрационный проект. Вы можете настроить кастомные колонки Kanban или работать в табличном режиме.",
        color: "green",
        category: "Документация, Встречи",
        availableCategories: [documentationCategoryId, demoCategories[4].id],
        userId,
        members: [
          {
            id: `member-${Date.now()}-2`,
            userId: userId,
            email: userEmail,
            name: userName,
            role: 'owner',
            addedDate: new Date().toISOString(),
            addedBy: userId,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Create demo categories FIRST (before projects)
    const now = new Date().toISOString();
    const demoCategories = [
      {
        id: crypto.randomUUID(),
        name: "Разработка",
        color: "bg-purple-500",
        description: "Задачи по программированию и разработке",
        userId: userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: "Дизайн",
        color: "bg-pink-500",
        description: "Графический дизайн и UI/UX",
        userId: userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: "Тестирование",
        color: "bg-green-500",
        description: "QA и тестирование функционала",
        userId: userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: "Документация",
        color: "bg-blue-500",
        description: "Написание технической документации",
        userId: userId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: "Встречи",
        color: "bg-orange-500",
        description: "Планирование встреч и созвонов",
        userId: userId,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Save categories
    for (const category of demoCategories) {
      await kv.set(`category:user:${userId}:${category.id}`, category);
    }

    // Get category IDs for projects
    const developmentCategoryId = demoCategories[0].id;
    const designCategoryId = demoCategories[1].id;
    const testingCategoryId = demoCategories[2].id;
    const documentationCategoryId = demoCategories[3].id;

    // Save projects
    for (const project of demoProjects) {
      await kv.set(`project:user:${userId}:${project.id}`, project);
    }

    // Create demo tasks for personal tasks
    const personalTasks = [
      {
        id: crypto.randomUUID(),
        title: "👋 Добро пожаловать в T24!",
        description: "Изучите основные возможности системы: создавайте задачи, управляйте проектами, работайте в Kanban или табличном режиме.",
        status: "todo",
        priority: "medium",
        assigneeId: userId,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Попробуйте перетащить задачу",
        description: "В режиме Kanban вы можете перетаскивать задачи между колонками для изменения статуса",
        status: "in_progress",
        priority: "high",
        assigneeId: userId,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Создайте свою первую задачу",
        description: "Нажмите кнопку '+ Создать задачу' чтобы добавить новую задачу",
        status: "todo",
        priority: "low",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Save personal tasks
    for (const task of personalTasks) {
      await kv.set(`task:user:${userId}:${task.id}`, task);
    }

    // Create demo tasks for projects
    const projectTasks = [
      // Project 1 tasks (Ваш первый проект)
      {
        id: crypto.randomUUID(),
        title: "Изучить возможности проекта",
        description: "Ознакомьтесь с функциями управления проектами: добавление участников, настройка колонок Kanban, архивирование",
        status: "done",
        priority: "high",
        projectId: project1Id,
        assigneeId: userId,
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Настроить кастомные колонки",
        description: "В настройках проекта вы можете создать собственные статусы задач для Kanban доски",
        status: "in_progress",
        priority: "medium",
        projectId: project1Id,
        assigneeId: userId,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Добавить описание проекта",
        description: "Нажмите на иконку информации рядом с названием проекта, чтобы отредактировать его описание",
        status: "todo",
        priority: "low",
        projectId: project1Id,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Попробуйте табличный вид",
        description: "Переключитесь между режимами Kanban и Таблица, чтобы увидеть разные способы работы с задачами",
        status: "todo",
        priority: "medium",
        projectId: project1Id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Project 2 tasks (Ваш второй проект)
      {
        id: crypto.randomUUID(),
        title: "Пригласите участников",
        description: "Добавьте коллег в проект через меню 'Участники'. Вы можете назначить разные роли: владелец, участник с правами, участник, наблюдатель",
        status: "done",
        priority: "high",
        projectId: project2Id,
        assigneeId: userId,
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Прикрепите файл к задаче",
        description: "Откройте любую задачу и попробуйте прикрепить файл (до 50 МБ)",
        status: "in_progress",
        priority: "medium",
        projectId: project2Id,
        assigneeId: userId,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Используйте фильтры",
        description: "В панели фильтров вы можете отбирать задачи по статусу, приоритету, исполнителю и категории",
        status: "review",
        priority: "low",
        projectId: project2Id,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Архивируйте завершенные проекты",
        description: "Когда проект завершен, вы можете переместить его в архив через меню настроек",
        status: "todo",
        priority: "critical",
        projectId: project2Id,
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        categoryId: null,
        attachments: [],
        userId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Save project tasks - ONLY in project namespace to avoid duplication issues
    for (const task of projectTasks) {
      await kv.set(`task:project:${task.projectId}:${task.id}`, task);
      // NOT saving to task:user: to prevent duplication - server will find via projectId
    }

    console.log(`Created demo data for user ${userId}:`, {
      categories: demoCategories.length,
      projects: demoProjects.length,
      personalTasks: personalTasks.length,
      projectTasks: projectTasks.length,
    });

    return {
      success: true,
      categoriesCount: demoCategories.length,
      projectsCount: demoProjects.length,
      tasksCount: personalTasks.length + projectTasks.length,
    };
  } catch (error) {
    console.error('Error creating demo data:', error);
    throw error;
  }
}
