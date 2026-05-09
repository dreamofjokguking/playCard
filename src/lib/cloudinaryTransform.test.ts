import { describe, expect, it } from 'vitest';
import { cloudinaryTransform } from './cloudinaryTransform';

describe('cloudinaryTransform', () => {
  it('inserts transform segment into a Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';
    const result = cloudinaryTransform(url, { width: 640 });
    expect(result).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/v1/sample.jpg'
    );
  });

  it('respects custom crop and quality', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/folder/sample.png';
    const result = cloudinaryTransform(url, { width: 480, crop: 'fill', quality: 80 });
    expect(result).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_80,c_fill,w_480/folder/sample.png'
    );
  });

  it('returns non-Cloudinary URL untouched', () => {
    const url = 'https://example.com/image.jpg';
    expect(cloudinaryTransform(url, { width: 640 })).toBe(url);
  });

  it('returns empty string for empty input', () => {
    expect(cloudinaryTransform('', { width: 640 })).toBe('');
  });

  it('does not double-apply when transform segment already exists', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/w_320,c_fill/v1/sample.jpg';
    expect(cloudinaryTransform(url, { width: 640 })).toBe(url);
  });

  it('does not mistake a folder name "version" or path for transform', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg';
    const result = cloudinaryTransform(url, { width: 640 });
    expect(result).toContain('upload/f_auto,q_auto,w_640/v1/folder/sample.jpg');
  });

  it('detects upload paths with multiple folder levels', () => {
    const url = 'https://res.cloudinary.com/myapp/image/upload/playcard/club-cover/abc.jpg';
    const result = cloudinaryTransform(url, { width: 480 });
    expect(result).toBe(
      'https://res.cloudinary.com/myapp/image/upload/f_auto,q_auto,w_480/playcard/club-cover/abc.jpg'
    );
  });

  it('rounds non-integer width', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/x.jpg';
    const result = cloudinaryTransform(url, { width: 640.7 });
    expect(result).toContain('w_641');
  });
});
