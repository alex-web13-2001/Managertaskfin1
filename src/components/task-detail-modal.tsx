import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  Calendar,
  Flame,
  Tag,
  User,
  Paperclip,
  Clock,
  Trash2,
} from 'lucide-react';

type TaskDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
};

// Mock task data - в реальном приложении это будет загружаться по ID
const getTaskData = (id: string) => ({
  id,
  title: 'Разработать дизайн главной страницы',
  description:
    'Создать макеты главной страницы в Figma. Нужно учесть современные тренды дизайна и обеспечить удобство использования на различных устройствах.',
  status: 'Назначено',
  priority: 'high',
  project: 'Веб-сайт',
  projectColor: 'bg-purple-500',
  category: 'Дизайн',
  categoryColor: 'bg-pink-500',
  assignee: 'Александр Петров',
  assigneeShort: 'АП',
  creator: 'Мария Иванова',
  creatorShort: 'МИ',
  dueDate: '15 ноября 2024',
  createdAt: '10 ноября 2024',
  updatedAt: '2 часа назад',
  tags: ['UI/UX', 'срочно', 'дизайн'],
  comments: [
    {
      id: '1',
      author: 'Мария Иванова',
      authorShort: 'МИ',
      text: 'Не забудьте про адаптивную версию для мобильных устройств',
      time: '1 час назад',
    },
    {
      id: '2',
      author: 'Александр Петров',
      authorShort: 'АП',
      text: 'Хорошо, учту это в макете',
      time: '30 минут назад',
    },
  ],
  attachments: [
    { id: '1', name: 'mockup-v1.fig', size: '2.4 MB' },
    { id: '2', name: 'requirements.pdf', size: '856 KB' },
  ],
});

export function TaskDetailModal({ open, onOpenChange, taskId }: TaskDetailModalProps) {
  const task = getTaskData(taskId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={task.projectColor} variant="secondary">
                  {task.project}
                </Badge>
                <Badge variant="outline" className={`${task.categoryColor} text-white border-0`}>
                  <Tag className="w-3 h-3 mr-1" />
                  {task.category}
                </Badge>
              </div>
              <DialogTitle className="text-2xl">{task.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Подробная информация о задаче
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Исполнитель:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                      {task.assigneeShort}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assignee}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Дедлайн:</span>
                <span className="text-red-600">{task.dueDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Приоритет:</span>
                <div className="flex items-center gap-1">
                  {task.priority === 'high' && (
                    <Flame className="w-4 h-4 text-red-600 fill-current" />
                  )}
                  <span className="text-red-600">Высокий</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Создатель:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                      {task.creatorShort}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.creator}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Создано:</span>
                <span>{task.createdAt}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Обновлено:</span>
                <span>{task.updatedAt}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Описание */}
          <div>
            <h4 className="mb-2">Описание</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
          </div>

          {/* Теги */}
          {task.tags.length > 0 && (
            <div>
              <h4 className="mb-2">Теги</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Вложения */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="w-4 h-4" />
              <h4>Вложения ({task.attachments.length})</h4>
            </div>
            <div className="space-y-2">
              {task.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{attachment.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Скачать
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Действия */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              Изменить статус
            </Button>
            <Button variant="outline" className="flex-1">
              Редактировать
            </Button>
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
