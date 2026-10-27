import { expect, test } from '@playwright/test';

test.describe('Spotify E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://open.spotify.com/intl-pt/', {
      waitUntil: 'domcontentloaded'
    });
  });

  test('deve encontrar KING OF ROCK de Che ao pesquisar king of rock che', async ({
    page
  }) => {
    const searchInput = page.getByRole('combobox', {
      name: 'O que você quer ouvir?'
    });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('king of rock che');

    await expect(page).toHaveURL(/\/search\/king%20of%20rock%20che\/?$/);
    await expect(searchInput).toHaveValue('king of rock che');

    const song = page
      .getByRole('grid', {
        name: 'Resultados da busca de músicas',
        exact: true
      })
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: /^king of rock$/i }) })
      .filter({ has: page.getByRole('link', { name: /^che$/i }) });

    await expect(song).toHaveCount(1);
    await expect(song).toBeVisible();
  });

  test('deve navegar da busca de Che até um álbum do artista', async ({
    page
  }) => {
    await page
      .getByRole('combobox', { name: 'O que você quer ouvir?' })
      .fill('Che');
    await expect(page).toHaveURL(/\/search\/Che\/?$/);

    const artist = page
      .getByRole('region', { name: 'Artistas', exact: true })
      .getByRole('link', { name: 'Che', exact: true });
    await expect(artist).toBeVisible();
    const artistPath = await artist.getAttribute('href');
    expect(artistPath).toMatch(/\/artist\/[a-zA-Z0-9]+$/);
    await artist.click();

    await expect(page).toHaveURL(
      new URL(artistPath!, 'https://open.spotify.com').href
    );
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: 'Che', exact: true, level: 1 })
    ).toBeVisible();
    await expect(
      main.getByRole('heading', { name: 'Populares', exact: true })
    ).toBeVisible();
    await expect(
      main.getByRole('grid').first().getByRole('row').first()
    ).toBeVisible();

    const discography = main.getByRole('region', {
      name: 'Discografia',
      exact: true
    });
    await discography
      .getByRole('checkbox', { name: 'Álbuns', exact: true })
      .check();
    const album = discography
      .getByRole('link')
      .filter({ hasNotText: 'Mostrar tudo' })
      .and(page.locator('a[href*="/album/"]'))
      .first();
    await expect(album).toBeVisible();
    const albumName = (await album.innerText()).trim();
    const albumPath = await album.getAttribute('href');
    expect(albumName).not.toBe('');
    expect(albumPath).toMatch(/\/album\/[a-zA-Z0-9]+$/);
    await album.click();

    await expect(page).toHaveURL(
      new URL(albumPath!, 'https://open.spotify.com').href
    );
    await expect(
      main.getByRole('heading', { name: albumName, exact: true, level: 1 })
    ).toBeVisible();
    await expect(
      main.getByRole('link', { name: 'Che', exact: true }).first()
    ).toBeVisible();
  });

  test('deve solicitar login ao tentar criar uma playlist sem autenticação', async ({
    page
  }) => {
    const library = page.getByRole('navigation', {
      name: 'Principal',
      exact: true
    });
    await library
      .getByRole('button', { name: 'Criar playlist', exact: true })
      .click();

    const loginPrompt = page.getByRole('tooltip').filter({
      hasText: 'Faça login para criar e compartilhar playlists.'
    });
    await expect(loginPrompt).toBeVisible();
    await expect(page).toHaveURL('https://open.spotify.com/intl-pt/');
    await expect(
      library
        .getByRole('grid', { name: 'Sua Biblioteca', exact: true })
        .getByRole('link', { name: /playlist/i })
    ).toHaveCount(0);
    await loginPrompt
      .getByRole('button', { name: 'Entrar', exact: true })
      .click();

    await expect(page).toHaveURL(
      /^https:\/\/accounts\.spotify\.com\/[^?]*login(?:\?|$)/
    );
    await expect(
      page.getByRole('textbox', { name: 'E-mail', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Continuar', exact: true })
    ).toBeVisible();
  });
});
