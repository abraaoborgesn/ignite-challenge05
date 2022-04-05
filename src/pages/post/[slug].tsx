import { useRouter } from 'next/router';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  const router = useRouter()
  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }


  const totalWords = post.data.content.reduce((acumulator, item) => {
    const totalHeading = item.heading?.split(' ').length === undefined ? 0 : item.heading?.split(' ').length
    // console.log(totalHeading)    
    // console.log(RichText.asText(item.body).split(' ').length)

    return acumulator + totalHeading + RichText.asText(item.body).split(' ').length

  }, 0)

  // console.log(totalWords)

  const wordsPerMinutes = 200

  const readingTime = Math.ceil(totalWords / wordsPerMinutes)


  return (
    <>
      <img className={styles.img} src={post.data.banner.url} alt="banner" />

      <main className={styles.container}>

        <h1>{post.data.title}</h1>
        <section className={styles.info}>
          <div>
            <FiCalendar size={20} className={styles.icon} />
            <time>{format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            )}</time>
          </div>
          <div>
            <FiUser size={20} className={styles.icon} />
            <span>{post.data.author}</span>
          </div>
          <div>
            <FiClock size={20} className={styles.icon} />
            <span>{`${readingTime} min`}</span>
          </div>
        </section>

        {post.data.content.map(content => (

          <div key={content.heading}className={styles.content}>
            <h2>{content.heading}</h2>
            <div dangerouslySetInnerHTML={{
              __html: RichText.asHtml(content.body),
            }}>
            </div>
          </div>

        ))}

      </main>

    </>


  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ]
  );

  return {
    paths: posts.results.map(post => {
      return {
        params: { slug: post.uid }
      }
    }),
    fallback: true,
  }
};

export const getStaticProps = async ({ req, params }) => {

  const { slug } = params

  const prismic = getPrismicClient(req);

  const response = await prismic.getByUID('post', String(slug), {});


  return {
    props: {
      post: response
    },
    revalidate: 60 * 5 // 5 minutes
  }
};
