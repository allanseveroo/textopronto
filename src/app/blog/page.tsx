import Link from 'next/link';
import { blogPosts } from '@/lib/blog-posts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BlogIndex() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
        {blogPosts.map((post) => (
          <Card key={post.slug} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                <Link href={`/blog/posts/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription className='pt-2'>{post.description}</CardDescription>
            </CardHeader>
            <CardFooter className='mt-auto'>
              <Button asChild variant="outline">
                <Link href={`/blog/posts/${post.slug}`}>Ler Mais</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
