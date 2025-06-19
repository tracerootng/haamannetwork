import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';

type FormField = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
};

type ServiceFormProps = {
  title: string;
  description: string;
  amount?: number;
  fields: FormField[];
  onSubmit: (formData: any) => void;
  isLoading?: boolean;
};

const ServiceForm: React.FC<ServiceFormProps> = ({
  title,
  description,
  amount,
  fields,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="animate-slide-up">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
      
      {amount !== undefined && (
        <div className="bg-primary-500 bg-opacity-10 p-3 rounded-lg mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">Amount</p>
          <p className="text-lg font-bold text-primary-500">{formatCurrency(amount)}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              {field.type === 'select' ? (
                <Select
                  label={field.label}
                  name={field.name}
                  options={field.options || []}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  leftIcon={field.icon}
                />
              ) : (
                <Input
                  label={field.label}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  leftIcon={field.icon}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Continue
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ServiceForm;