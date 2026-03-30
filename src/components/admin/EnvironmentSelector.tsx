import { useApiEnvironment, ApiEnvironment } from '@/context/ApiEnvironmentContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Server, FlaskConical, Train } from 'lucide-react';

const environments: { value: ApiEnvironment; label: string; icon: React.ReactNode; color: string }[] = [
  { 
    value: 'production', 
    label: 'Production', 
    icon: <Server className="w-4 h-4" />,
    color: 'bg-green-500'
  },
  { 
    value: 'staging', 
    label: 'Staging', 
    icon: <FlaskConical className="w-4 h-4" />,
    color: 'bg-amber-500'
  },
  { 
    value: 'railway', 
    label: 'Railway (Dev)', 
    icon: <Train className="w-4 h-4" />,
    color: 'bg-purple-500'
  },
];

export function EnvironmentSelector() {
  const { environment, setEnvironment } = useApiEnvironment();

  const currentEnv = environments.find(e => e.value === environment);

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        API Environment
      </Badge>
      <Select value={environment} onValueChange={(value) => setEnvironment(value as ApiEnvironment)}>
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${currentEnv?.color}`} />
              {currentEnv?.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-lg z-50">
          {environments.map((env) => (
            <SelectItem key={env.value} value={env.value}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${env.color}`} />
                {env.icon}
                <span>{env.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
