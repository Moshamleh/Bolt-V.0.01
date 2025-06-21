import React, { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { uploadDiagnosticImage } from '../lib/supabase_modules/storage';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface ImageUploadButtonProps {
  onImageUpload: (imageUrl: string) => void;
  uploadedImageUrl: string | null;
  disabled?: boolean;
  className?: string;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageUpload,
  uploadedImageUrl,
  disabled = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled || isUploading) return;
    
    if (uploadedImageUrl) {
      // If there's already an image, clicking should remove it
      onImageUpload('');
    } else {
      // Otherwise, open the file picker
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadDiagnosticImage(file);
      onImageUpload(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Clear the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(
          "p-2 rounded-lg transition-colors",
          uploadedImageUrl 
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50" 
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        title={uploadedImageUrl ? "Remove image" : "Upload image"}
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : uploadedImageUrl ? (
          <X className="h-5 w-5" />
        ) : (
          <Camera className="h-5 w-5" />
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {uploadedImageUrl && (
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full"></div>
      )}
    </div>
  );
};

export default ImageUploadButton;