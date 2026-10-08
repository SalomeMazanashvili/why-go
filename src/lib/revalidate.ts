import { revalidatePath, revalidateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/supabase/admin'

// WHY-103: the one way admin writes refresh the public site. Call it after
// every successful write to a table the public site reads.
//
// revalidatePath alone re-renders pages but they re-read the Data Cache,
// which still holds the pre-publish rows: that's why a published day trip
// stayed out of /sitemap.xml until a deploy (the sitemap is now rendered per
// request, see src/app/sitemap.ts), and why a build could prerender
// a published page as 404. Expiring the tag first makes the re-render fetch
// fresh rows. ESLint blocks importing revalidatePath/revalidateTag anywhere
// else under src/app/api.
export function revalidateContent() {
  revalidateTag(CONTENT_TAG, { expire: 0 })
  revalidatePath('/', 'layout')
}
