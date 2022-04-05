import { useState } from 'react';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client'

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import Link from 'next/link'

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

  const [posts, setPosts] = useState(postsPagination.results)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)

  async function showMorePosts() {

    const updatedPosts = [...posts]
    // console.log(updatedPosts)

    await fetch(nextPage)
      .then(response => response.json())
      .then((data) => {
        // setPosts([...posts, ...data.results])        
        setNextPage(data.next_page)
        // console.log(data)

        data.results.map(post => {
          return updatedPosts.push(post)
        })

        setPosts(updatedPosts)
      })

  }

  return (
    <>
      <title>spacetravelling.</title>

      <main className={styles.container}>
        <div className={styles.posts}>

          {posts.map(post => (

            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <section className={styles.info}>
                  <div className={styles.user}>
                    <img src="/images/calendar.svg" alt="Data de modificação" />
                    <time>{format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}</time>
                  </div>
                  <div className={styles.user}>
                    <img src="/images/user.svg" alt="Usuário" />
                    <span>{post.data.author}</span>
                  </div>
                </section>
              </a>
            </Link>

          ))}

          {nextPage === null ? '' : <button onClick={showMorePosts}>Carregar mais posts</button>}
        </div>
      </main>

    </>
  )
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query<any>([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.content.heading', 'post.subtitle', 'post.author', 'post.banner'],
    pageSize: 20
  });

  // console.log(postsResponse)
  // console.log(JSON.stringify(postsResponse, null, 2))

  const postsPagination = {
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }

      }
    }),
    next_page: postsResponse.next_page
  }

  return {
    props: {
      postsPagination,
    }
  }

};
