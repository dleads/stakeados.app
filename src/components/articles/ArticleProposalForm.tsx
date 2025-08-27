'use client';

import React, { useState, useRef } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send, Upload, X, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { ContentService } from '@/lib/services/contentService';
import type { ContentCategory } from '@/types/content';

const proposalSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  summary: z
    .string()
    .min(50, 'Summary must be at least 50 characters')
    .max(500, 'Summary must be less than 500 characters'),
  outline: z
    .string()
    .min(100, 'Outline must be at least 100 characters')
    .max(2000, 'Outline must be less than 2000 characters'),
  author_experience: z
    .string()
    .min(50, 'Please describe your experience (minimum 50 characters)')
    .max(1000, 'Experience description must be less than 1000 characters'),
  previous_work: z.array(z.string().url('Please enter valid URLs')).optional(),
  suggested_level: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: 'Please select a difficulty level',
  }),
  suggested_category: z.string().optional(),
  estimated_read_time: z
    .number()
    .min(1, 'Estimated read time must be at least 1 minute')
    .max(60, 'Estimated read time must be less than 60 minutes')
    .optional(),
  supporting_documents: z.array(z.instanceof(File)).optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

interface ArticleProposalFormProps {
  onSuccess?: (data: any) => void;
  className?: string;
}

export default function ArticleProposalForm({
  onSuccess,
  className = '',
}: ArticleProposalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [previousWorkUrls, setPreviousWorkUrls] = useState<string[]>(['']);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      previous_work: [],
      estimated_read_time: 5,
    },
  });

  // Load categories on component mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await ContentService.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Handle file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError(
        'Some files were rejected. Please upload only PDF, DOC, DOCX, or TXT files under 5MB.'
      );
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    setValue('supporting_documents', [...uploadedFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setValue('supporting_documents', newFiles);
  };

  // Handle previous work URLs
  const addPreviousWorkUrl = () => {
    setPreviousWorkUrls(prev => [...prev, '']);
  };

  const removePreviousWorkUrl = (index: number) => {
    const newUrls = previousWorkUrls.filter((_, i) => i !== index);
    setPreviousWorkUrls(newUrls);
    const validUrls = newUrls.filter(url => url.trim() !== '');
    setValue('previous_work', validUrls);
  };

  const updatePreviousWorkUrl = (index: number, value: string) => {
    const newUrls = [...previousWorkUrls];
    newUrls[index] = value;
    setPreviousWorkUrls(newUrls);
    const validUrls = newUrls.filter(url => url.trim() !== '');
    setValue('previous_work', validUrls);
  };

  const onSubmit: SubmitHandler<ProposalFormValues> = async data => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare form data for submission
      const submissionData = {
        ...data,
        previous_work:
          data.previous_work?.filter(url => url.trim() !== '') || [],
        estimated_read_time:
          data.estimated_read_time ||
          ContentService.estimateReadingTime(data.outline),
      };

      const proposal =
        await ContentService.createArticleProposal(submissionData);

      setSuccess(
        'Your proposal has been submitted successfully! You will be notified when it is reviewed.'
      );
      reset();
      setPreviousWorkUrls(['']);
      setUploadedFiles([]);

      if (onSuccess) {
        onSuccess(proposal);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-stakeados-gray-800 rounded-gaming p-8 border border-stakeados-gray-600">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Propose an Article
          </h2>
          <p className="text-stakeados-gray-300">
            Share your knowledge with the Stakeados community. All proposals are
            reviewed by our editorial team.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-stakeados-red/10 border border-stakeados-red/30 rounded-gaming p-4">
              <p className="text-stakeados-red text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-stakeados-primary/10 border border-stakeados-primary/30 rounded-gaming p-4">
              <p className="text-stakeados-primary text-sm">{success}</p>
            </div>
          )}

          {/* Article Title */}
          <label className="block text-sm font-medium text-stakeados-gray-200 mb-2">
            Article Title *
          </label>
          <Input
            {...register('title')}
            placeholder="e.g., A Beginner's Guide to Smart Contracts on Base"
          />
          <p className="text-sm text-stakeados-gray-400 mt-1">
            Choose a clear, descriptive title that captures your article's main
            topic
          </p>
          {errors.title?.message && (
            <p className="text-sm text-stakeados-red mt-1">
              {errors.title.message}
            </p>
          )}

          {/* Summary */}
          <Textarea
            label="Summary *"
            {...register('summary')}
            error={errors.summary?.message}
            placeholder="A brief summary of what your article will cover. This will be shown in article previews."
            rows={3}
          />
          <p className="text-sm text-stakeados-gray-400 mt-1">
            {`${watch('summary')?.length || 0}/500 characters (minimum 50)`}
          </p>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stakeados-gray-200">
              Suggested Category
            </label>
            <Controller
              name="suggested_category"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-4 py-3 focus:ring-2 focus:ring-stakeados-primary/50 focus:outline-none"
                >
                  <option value="">Select a category (optional)</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name.en}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.suggested_category && (
              <p className="text-sm text-stakeados-red">
                {errors.suggested_category.message}
              </p>
            )}
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stakeados-gray-200">
              Suggested Difficulty Level *
            </label>
            <Controller
              name="suggested_level"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-4 py-3 focus:ring-2 focus:ring-stakeados-primary/50 focus:outline-none"
                >
                  <option value="">Select difficulty level</option>
                  <option value="beginner">Beginner - New to the topic</option>
                  <option value="intermediate">
                    Intermediate - Some experience required
                  </option>
                  <option value="advanced">
                    Advanced - Deep technical knowledge
                  </option>
                </select>
              )}
            />
            {errors.suggested_level && (
              <p className="text-sm text-stakeados-red">
                {errors.suggested_level.message}
              </p>
            )}
          </div>

          {/* Estimated Read Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stakeados-gray-200">
              Estimated Read Time (minutes)
            </label>
            <Controller
              name="estimated_read_time"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="1"
                  max="60"
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-4 py-3 focus:ring-2 focus:ring-stakeados-primary/50 focus:outline-none"
                  placeholder="5"
                />
              )}
            />
            {errors.estimated_read_time && (
              <p className="text-sm text-stakeados-red">
                {errors.estimated_read_time.message}
              </p>
            )}
            <p className="text-sm text-stakeados-gray-400">
              How long do you estimate it will take to read your article?
            </p>
          </div>

          {/* Article Outline */}
          <Textarea
            label="Article Outline *"
            {...register('outline')}
            error={errors.outline?.message}
            placeholder="Provide a structured outline of your article. Use bullet points or numbered lists to show the main sections and key points you'll cover."
            rows={8}
          />
          <p className="text-sm text-stakeados-gray-400 mt-1">
            {`${watch('outline')?.length || 0}/2000 characters (minimum 100)`}
          </p>

          {/* Author Experience */}
          <Textarea
            label="Your Experience & Expertise *"
            {...register('author_experience')}
            error={errors.author_experience?.message}
            placeholder="Describe your background and experience related to this topic. What qualifies you to write about this subject?"
            rows={4}
          />
          <p className="text-sm text-stakeados-gray-400 mt-1">
            {`${watch('author_experience')?.length || 0}/1000 characters (minimum 50)`}
          </p>

          {/* Previous Work URLs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-stakeados-gray-200">
                Links to Previous Work (Optional)
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addPreviousWorkUrl}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>

            <div className="space-y-3">
              {previousWorkUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={url}
                      onChange={e =>
                        updatePreviousWorkUrl(index, e.target.value)
                      }
                      placeholder="https://your-blog.com/article or https://github.com/username/project"
                      className="w-full bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-4 py-3 focus:ring-2 focus:ring-stakeados-primary/50 focus:outline-none"
                    />
                  </div>
                  {previousWorkUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePreviousWorkUrl(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {errors.previous_work && (
              <p className="text-sm text-stakeados-red">
                {errors.previous_work.message}
              </p>
            )}
            <p className="text-sm text-stakeados-gray-400">
              Share links to your blog, portfolio, GitHub, or other published
              work that demonstrates your expertise.
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-stakeados-gray-200">
              Supporting Documents (Optional)
            </label>

            <div className="border-2 border-dashed border-stakeados-gray-600 rounded-gaming p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="space-y-2">
                <Upload className="w-8 h-8 text-stakeados-gray-400 mx-auto" />
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                  <p className="text-sm text-stakeados-gray-400 mt-2">
                    Upload supporting documents, portfolio samples, or drafts
                    (PDF, DOC, DOCX, TXT - max 5MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-stakeados-gray-200">
                  Uploaded Files:
                </p>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-stakeados-gray-700 rounded-gaming p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-stakeados-primary" />
                      <span className="text-sm text-white">{file.name}</span>
                      <span className="text-xs text-stakeados-gray-400">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-stakeados-gray-600">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Proposal...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Article Proposal
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
