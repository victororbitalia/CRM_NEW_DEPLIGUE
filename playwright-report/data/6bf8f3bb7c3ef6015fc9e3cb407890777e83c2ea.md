# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "Sign in to your account" [level=2] [ref=e15]
      - paragraph [ref=e16]:
        - text: Or
        - link "create a new account" [ref=e17] [cursor=pointer]:
          - /url: /register
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Email address*
          - textbox "Email address*" [ref=e23]:
            - /placeholder: Enter your email
        - generic [ref=e24]:
          - generic [ref=e25]: Password*
          - textbox "Password*" [ref=e27]:
            - /placeholder: Enter your password
        - button "Sign in" [ref=e28] [cursor=pointer]
      - generic [ref=e29]:
        - generic [ref=e34]: Or
        - link "Forgot your password?" [ref=e36] [cursor=pointer]:
          - /url: /forgot-password
```