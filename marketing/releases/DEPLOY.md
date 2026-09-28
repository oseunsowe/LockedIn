# LockedIn landing v2 release

Target established in TODO.md: `lockedinmission.app`, cPanel SFTP document root `public_html/`.

Archive: `lockedin-landing-v2-20260927.zip`. It contains the landing page, its styles/modules, optimized public media/fonts, robots/sitemap and Apache configuration. No app code, database files, credentials or admin files are included. Confirmation, unsubscribe, password reset and existing admin pages must remain on the server.

## Upload procedure

1. Connect through the existing SFTP account. Confirm its host key and actual document root.
2. Back up every remote file that will be replaced to a private location outside public_html. Compare the server .htaccess and merge the supplied MIME/cache rules if the server contains additional rules.
3. Upload assets/, css/ and js/ first. Upload robots.txt and sitemap.xml. Publish index.html last, preferably using an atomic rename. Do not delete unrelated server files or replace the entire public_html directory.
4. Confirm the live title is “LockedIn — Turn Your Commitments Into Missions”. Fetch every manifest path and verify the new files, status codes and MIME types. Check the hero, section navigation, mobile menu and form initialization in a browser.
5. Existing confirmation/unsubscribe pages must still respond. Do not create real signups or send email without an explicitly chosen test address.

For File Manager upload, extract into a private temporary folder first and copy the files in this order. Do not leave the release archive or backup in public_html.

The user supplied the private SFTP connection configuration in `supabase/migrations/sftp.md`. That file and the adjacent extensionless credential note are gitignored. Credentials are not included in this release. See the deployment report for final publication and verification status.
