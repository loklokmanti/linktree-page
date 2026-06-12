# How to Publish Your Linktree Page & Connect a Custom Domain (Namecheap)

## Step 1: Host Your Site (Prerequisite)

Before connecting your domain, your site needs to be online. I recommend **Netlify** for the easiest custom domain setup.

1.  **Sign up** for a free account at [Netlify.com](https://www.netlify.com/).
2.  Log in and drag your `linktree_page` folder onto the "Sites" dashboard to deploy it.
3.  You will get a temporary URL (e.g., `coffee-cat-123.netlify.app`).

## Step 2: Configure Custom Domain on Netlify

1.  Click on your new site in the Netlify dashboard.
2.  Go to **Site Settings** > **Domain Management**.
3.  Click **Add a domain**.
4.  Enter your custom domain (e.g., `cofbla.com`) and click **Verify**.
5.  Click **Yes, add domain**.
6.  Netlify will show you a warning and then give you a list of **4 Nameservers** (e.g., `dns1.p01.nsone.net`, etc.). Keep this page open.

## Step 3: Update DNS Settings in Namecheap

1.  **Log in** to your [Namecheap Dashboard](https://www.namecheap.com/myaccount/login/).
2.  Click on **Domain List** in the left sidebar.
3.  Click the **Manage** button next to your domain.
4.  Scroll down to the **Nameservers** section.
5.  In the dropdown menu, change "Namecheap BasicDNS" to **Custom DNS**.
6.  Copy and paste the **4 Nameservers** from Netlify into the name server lines in Namecheap.
7.  Click the small **green checkmark** icon to save your changes.

**Done!**
Netlify will automatically verify the connection (usually within an hour) and issue a free SSL certificate so your site loads securely with `https://`.
